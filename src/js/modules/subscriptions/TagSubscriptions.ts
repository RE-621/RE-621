import { UpdateData, UpdateDefinition, SubscriptionSettings } from "./SubscriptionManager";
import { Api } from "../../components/api/Api";
import { RE6Module, Settings } from "../../components/RE6Module";
import { Subscription } from "./Subscription";
import { ApiPost } from "../../components/api/responses/ApiPost";
import { Post } from "../../components/data/Post";

export class TagSubscriptions extends RE6Module implements Subscription {
    updateDefinition: UpdateDefinition = {
        imageSrc: (data) => {
            return Post.createPreviewUrlFromMd5(data.thumbnailMd5);
        },
        imageHref: (data) => {
            return `https://e621.net/posts/${data.id}`;
        },
        updateText: (data) => {
            return data.name;
        },
        sourceHref: (data) => {
            return `https://e621.net/posts?tags=${encodeURIComponent(data.name.replace(/ /g, "_"))}`;
        },
        sourceText: () => {
            return "View Tag";
        }
    };

    limit: number;
    lastUpdate: number;
    tab: JQuery<HTMLElement>;

    public constructor() {
        super();
    }

    public getName(): string {
        return "Tags";
    }

    public getSubscriberId($element: JQuery<HTMLElement>): string {
        return $element.parent().attr("data-tag");
    }

    public getElementsToInsertAfter(): JQuery<HTMLElement> {
        return $("#tag-box li span.tag-action-dummy, #tag-list li span.tag-action-dummy");
    }

    public createSubscribeButton(): JQuery<HTMLElement> {
        return $("<a>")
            .attr("href", "#")
            .addClass("tag-subscription-button subscribe")
            .html(`<i class="far fa-heart"></i>`);
    }

    public createUnsubscribeButton(): JQuery<HTMLElement> {
        return $("<a>")
            .attr("href", "#")
            .addClass("tag-subscription-button unsubscribe")
            .html(`<i class="fas fa-heart"></i>`);
    }

    public async getUpdatedEntries(): Promise<UpdateData[]> {
        const results: UpdateData[] = [];

        const tagData: SubscriptionSettings = this.fetchSettings("data", true);
        if (Object.keys(tagData).length === 0) {
            return results;
        }

        for (const tagName of Object.keys(tagData)) {
            const postsJson: ApiPost[] = (await Api.getJson("/posts.json?tags=" + encodeURIComponent(tagName.replace(/ /g, "_")))).posts;
            for (const post of postsJson) {
                if (new Date(post.created_at).getTime() > this.lastUpdate) {
                    results.push(await this.formatPostUpdate(post, tagName));
                }
            }
        }
        this.pushSettings("data", tagData);
        return results;
    }

    private async formatPostUpdate(value: ApiPost, tagName: string): Promise<UpdateData> {
        return {
            id: value.id,
            name: tagName.replace(/ /g, " "),
            date: new Date(value.created_at),
            last: -1,
            thumbnailMd5: value.file.md5
        };
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return {
            enabled: true,
            data: {}
        };
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TagInfo {
    // TODO Fix this
}
