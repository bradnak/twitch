import generateRandomString from '@d-fischer/randomstring';
import * as crypto from 'crypto';
import type { HelixWebHookHubRequestOptions } from 'twitch';
import type { WebHookListener } from '../WebHookListener';

/** @private */
export type SubscriptionResultType<T extends Subscription> = T extends Subscription<infer O> ? O : never;

/**
 * @hideProtected
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Subscription</** @private */ T = any> {
	private _verified: boolean = false;
	protected _secret: string;
	private _refreshTimer?: NodeJS.Timer;
	private _unsubscribeResolver?: () => void;

	/** @private */
	protected constructor(
		protected _handler: (obj: T) => void,
		protected _client: WebHookListener,
		private _validityInSeconds: number = 100000
	) {}

	/**
	 * Whether the subscription has been verified by Twitch.
	 */
	get verified(): boolean {
		return this._verified;
	}

	/** @private */
	_verify(): void {
		this._verified = true;
	}

	/** @private */
	_generateNewCredentials(): void {
		this._secret = generateRandomString(16);
	}

	/** @private */
	_handleData(data: string, algoAndSignature: string): boolean {
		const [algorithm, signature] = algoAndSignature.split('=', 2);

		const hash = crypto.createHmac(algorithm, this._secret).update(data).digest('hex');

		if (hash === signature) {
			this._handler(this.transformData(JSON.parse(data)));
			return true;
		}

		return false;
	}

	/** @private */
	_handleUnsubscribe(): boolean {
		if (this._unsubscribeResolver) {
			this._unsubscribeResolver();
			this._unsubscribeResolver = undefined;
			return true;
		}
		return false;
	}

	/**
	 * Activates the subscription.
	 */
	async start(): Promise<void> {
		if (this._refreshTimer) {
			clearInterval(this._refreshTimer);
		}
		await this._createNewSubscription();
		this._refreshTimer = setInterval(async () => {
			await this._createNewSubscription();
		}, this._validityInSeconds * 800); // refresh a little bit faster than we could theoretically make work, but in millis
	}

	/**
	 * Suspends the subscription, not removing it from the listener.
	 */
	async suspend(): Promise<void> {
		if (this._refreshTimer) {
			clearInterval(this._refreshTimer);
			this._refreshTimer = undefined;
		}
		const unsubscribePromise = new Promise(resolve => (this._unsubscribeResolver = resolve));
		await this._unsubscribe();
		await unsubscribePromise;
	}

	/**
	 * Deactivates the subscription and removes it from the listener.
	 */
	async stop(): Promise<void> {
		await this.suspend();
		this._client._dropSubscription(this.id);
	}

	protected async _getOptions(): Promise<HelixWebHookHubRequestOptions> {
		return {
			callbackUrl: await this._client._buildHookUrl(this.id),
			secret: this._secret,
			validityInSeconds: this._validityInSeconds
		};
	}

	/** @private */
	abstract get id(): string;

	protected abstract _subscribe(): Promise<void>;

	protected abstract _unsubscribe(): Promise<void>;

	protected abstract transformData(response: object): T;

	private async _createNewSubscription() {
		this._generateNewCredentials();
		await this._subscribe();
	}
}
