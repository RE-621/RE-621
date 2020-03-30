import { RE6Module, Settings } from "../../components/RE6Module";
import { Page, PageDefintion } from "../../components/data/Page";
import { Api } from "../../components/api/Api";
import { ApiPost } from "../../components/api/responses/ApiPost";
import { PostHtml } from "../../components/api/PostHtml";
import { InstantSearch } from "./InstantSearch";
import { Post } from "../../components/data/Post";
import { BlacklistEnhancer } from "./BlacklistEnhancer";
import { SettingsController } from "../general/SettingsController";

declare const Danbooru;

/**
 * Gets rid of the default pagination and instead appends new posts
 * when you scrolled to the bottom
 */
export class InfiniteScroll extends RE6Module {

    private $postContainer: JQuery<HTMLElement>;
    private $loadingIndicator: JQuery<HTMLElement>;
    private currentQuery: string;
    private nextPageToGet: number;
    private isInProgress: boolean;
    private pagesLeft: boolean;

    public constructor() {
        super(PageDefintion.search);
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return { enabled: true };
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        if (!this.canInitialize()) return;
        super.create();

        this.$postContainer = $("#posts-container");

        this.$loadingIndicator = $("<div>").attr("id", "re-infinite-scroll-loading").addClass("lds-dual-ring");
        this.$loadingIndicator.insertAfter(this.$postContainer);
        this.$loadingIndicator.hide();

        this.currentQuery = Page.getQueryParameter("tags") !== null ? Page.getQueryParameter("tags") : "";
        const page = parseInt(Page.getQueryParameter("page"));
        this.nextPageToGet = isNaN(page) ? 2 : page + 1;
        this.isInProgress = false;
        this.pagesLeft = true;

        //Wait until all images are loaded, to prevent fetching posts 
        //while the layout is still changing
        $(() => {
            $(window).scroll(async () => { await this.addMorePosts(); });

            //If the user has few posts per page, he might already be scrolled to the bottom
            this.addMorePosts();
        });
    }

    /**
     * Adds more posts to the site, if the user has scrolled down enough
     */
    private async addMorePosts(): Promise<void> {
        if (!this.isEnabled() || this.isInProgress || !this.pagesLeft || !this.shouldAddMore()) {
            return;
        }
        this.isInProgress = true;
        this.$loadingIndicator.show();
        const posts: ApiPost[] = (await Api.getJson(`/posts.json?tags=${this.currentQuery}&page=${this.nextPageToGet}`)).posts;
        Page.setQueryParameter("page", this.nextPageToGet.toString());
        this.addPageIndicator();
        for (const json of posts) {
            const element = PostHtml.create(json);
            const post = new Post(element);
            //Add post to the list of posts currently visible
            //This is important because InstantSearch relies on it
            Post.appendPost(post);

            //Apply blacklist before appending, to prevent image loading
            post.applyBlacklist();

            this.$postContainer.append(element);
            //Hide if blacklist is active and post matches the blacklist
        }
        this.pagesLeft = posts.length !== 0;
        this.isInProgress = false;
        this.$loadingIndicator.hide();

        SettingsController.getModuleWithType<BlacklistEnhancer>(BlacklistEnhancer).updateSidebar();
        SettingsController.getModuleWithType<InstantSearch>(InstantSearch).applyFilter();

        this.nextPageToGet++;
    }

    private addPageIndicator(): void {
        const url = document.location.href;
        this.$postContainer.append($("<a>").attr("href", url).addClass("instantsearch-seperator").html(`<h2>Page: ${this.nextPageToGet}</h2>`));
    }

    /**
     * Checks if the user has scrolled down enough, so that more
     * posts should be appended
     */
    private shouldAddMore(): boolean {
        return $(window).scrollTop() + $(window).height() > $(document).height() - 50;
    }
}
