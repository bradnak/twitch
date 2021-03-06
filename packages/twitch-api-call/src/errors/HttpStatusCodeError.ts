import { CustomError } from './CustomError';

/**
 * Thrown whenever a HTTP error occurs. Some HTTP errors are handled in the library when they're expected.
 */
export class HttpStatusCodeError extends CustomError {
	private readonly _statusCode: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly _body: any;

	/** @private */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(statusCode: number, statusText: string, body: any) {
		super(`Encountered HTTP status code ${statusCode}: ${statusText}\n\nBody:\n${JSON.stringify(body, null, 2)}`);
		this._statusCode = statusCode;
		this._body = body;
	}

	get statusCode(): number {
		return this._statusCode;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get body(): any {
		return this._body;
	}
}
