import { Enumerable } from '@d-fischer/shared-utils';
import type { ApiClient } from '../../../ApiClient';

export type HelixEventSubSubscriptionStatus =
	| 'enabled'
	| 'webhook_callback_verification_pending'
	| 'webhook_callback_verification_failed'
	| 'notification_failures_exceeded'
	| 'authorization_revoked'
	| 'user_removed';

/** @private */
export interface HelixEventSubWebHookTransportData {
	/**
	 * The type of transport.
	 */
	method: 'webhook';

	/**
	 * The callback URL to send event notifications to.
	 */
	callback: string;
}

/** @private */
export type HelixEventSubTransportData = HelixEventSubWebHookTransportData;

/** @private */
export interface HelixEventSubSubscriptionData {
	id: string;
	status: HelixEventSubSubscriptionStatus;
	type: string;
	version: string;
	condition: object;
	created_at: string;
	transport: HelixEventSubTransportData;
}

/**
 * An EventSub subscription.
 */
export class HelixEventSubSubscription {
	/** @private */
	@Enumerable(false) protected readonly _client: ApiClient;

	/** @private */
	constructor(private readonly _data: HelixEventSubSubscriptionData, client: ApiClient) {
		this._client = client;
	}

	/**
	 * The ID of the subscription.
	 */
	get id(): string {
		return this._data.id;
	}

	/**
	 * The status of the subscription.
	 */
	get status(): HelixEventSubSubscriptionStatus {
		return this._data.status;
	}

	/**
	 * The event type that the subscription is listening to.
	 */
	get type(): string {
		return this._data.type;
	}

	/**
	 * The condition of the subscription.
	 */
	get condition(): object {
		return this._data.condition;
	}

	/**
	 * The date and time of creation of the subscription.
	 */
	get creationDate(): object {
		return new Date(this._data.created_at);
	}

	/**
	 * End the EventSub subscription.
	 */
	async unsubscribe(): Promise<void> {
		return this._client.helix.eventSub.deleteSubscription(this._data.id);
	}
}
