import { Cacheable, CachedGetter } from '@d-fischer/cache-decorators';
import { Enumerable } from '@d-fischer/shared-utils';
import type { HelixUser } from '../User/HelixUser';
import type { ApiClient } from '../../../ApiClient';
import { HellFreezesOverError } from '../../../Errors/HellFreezesOverError';

export type HelixVideoViewableStatus = 'public' | 'private';
export type HelixVideoType = 'upload' | 'archive' | 'highlight';

/** @private */
export interface HelixVideoData {
	id: string;
	user_id: string;
	user_name: string;
	title: string;
	description: string;
	created_at: string;
	published_at: string;
	url: string;
	thumbnail_url: string;
	viewable: HelixVideoViewableStatus;
	view_count: number;
	language: string;
	type: HelixVideoType;
	duration: string;
}

/**
 * A video on Twitch.
 */
@Cacheable
export class HelixVideo {
	/** @private */
	@Enumerable(false) protected readonly _client: ApiClient;

	/** @private */
	constructor(private readonly _data: HelixVideoData, client: ApiClient) {
		this._client = client;
	}

	/**
	 * The ID of the video.
	 */
	get id(): string {
		return this._data.id;
	}

	/**
	 * The ID of the user who created the video.
	 */
	get userId(): string {
		return this._data.user_id;
	}

	/**
	 * The display name of the user who created the video.
	 */
	get userDisplayName(): string {
		return this._data.user_name;
	}

	/**
	 * Retrieves information about the user who created the video.
	 */
	async getUser(): Promise<HelixUser | null> {
		return this._client.helix.users.getUserById(this._data.user_id);
	}

	/**
	 * The title of the video.
	 */
	get title(): string {
		return this._data.title;
	}

	/**
	 * The description of the video.
	 */
	get description(): string {
		return this._data.description;
	}

	/**
	 * The date when the video was created.
	 */
	get creationDate(): Date {
		return new Date(this._data.created_at);
	}

	/**
	 * The date when the video was published.
	 */
	get publishDate(): Date {
		return new Date(this._data.published_at);
	}

	/**
	 * The URL of the video.
	 */
	get url(): string {
		return this._data.url;
	}

	/**
	 * The URL of the thumbnail of the video.
	 */
	get thumbnailUrl(): string {
		return this._data.thumbnail_url;
	}

	/**
	 * Whether the video is public or not.
	 */
	get isPublic(): boolean {
		return this._data.viewable === 'public';
	}

	/**
	 * The number of views of the video.
	 */
	get views(): number {
		return this._data.view_count;
	}

	/**
	 * The language of the video.
	 */
	get language(): string {
		return this._data.language;
	}

	/**
	 * The type of the video.
	 */
	get type(): HelixVideoType {
		return this._data.type;
	}

	/**
	 * The duration of the video, as formatted by Twitch.
	 */
	get duration(): string {
		return this._data.duration;
	}

	/**
	 * The duration of the video, in seconds.
	 */
	@CachedGetter()
	get durationInSeconds(): number {
		const parts = this._data.duration.match(/\d+[hms]/g);
		if (!parts) {
			throw new HellFreezesOverError(`Could not parse duration string: ${this._data.duration}`);
		}
		return parts
			.map(part => {
				const partialMatch = part.match(/(\d+)([hms])/);
				if (!partialMatch) {
					throw new HellFreezesOverError(`Could not parse partial duration string: ${part}`);
				}

				const [, num, unit] = partialMatch;
				return parseInt(num, 10) * { h: 3600, m: 60, s: 1 }[unit];
			})
			.reduce((a, b) => a + b);
	}
}
