export interface Post {
    id: string;
    user_id: string;
    platform: string;
    content: string | null;
    media_urls: string[] | null;
}

export interface PublishResult {
    url: string;
}

export interface PlatformModule {
    publish(post: Post, accessToken: string): Promise<PublishResult>;
}
