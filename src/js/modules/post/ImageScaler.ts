import { Danbooru } from "../../components/api/Danbooru";
import { PageDefintion } from "../../components/data/Page";
import { Post } from "../../components/data/Post";
import { ModuleController } from "../../components/ModuleController";
import { RE6Module, Settings } from "../../components/RE6Module";

/**
 * Handles scaling post images in an intelligent way
 */
export class ImageScaler extends RE6Module {

    private post: Post;
    private image: JQuery<HTMLElement>;

    private resizeSelector: JQuery<HTMLElement>;

    public constructor() {
        super(PageDefintion.post, true);
        this.registerHotkeys(
            { keys: "hotkeyScale", fnct: () => { this.setScale(); } },
            { keys: "hotkeyFullscreen", fnct: this.openFullscreen },
        );
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return {
            enabled: true,

            hotkeyScale: "v|0",         // cycle through the varous scaling modes
            hotkeyFullscreen: "",       // open the current post in fullscreen mode

            clickScale: true,

            size: "fit-vertical",
        };
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        super.create();

        this.post = Post.getViewingPost();
        this.image = $("img#image");

        const resizeButtonContainer = $("#image-resize-cycle").empty();
        this.setImageSize(this.fetchSettings("size"));

        this.resizeSelector = $("<select>")
            .html(`
                <option value="sample">Sample</option>
                <option value="fit-vertical">Fill Screen</option>
                <option value="fit-horizontal">Fit Horizontally</option>
                <option value="original">Original</option>
            `)
            .val(this.fetchSettings("size"))
            .addClass("button btn-neutral")
            .appendTo(resizeButtonContainer)
            .change(async (event, save) => {
                const size = $(event.target).val() + "";
                this.setImageSize(size);
                if (save !== false) await this.pushSettings("size", size);
            });

        $("<a>")
            .attr({
                "href": this.post.getImageURL(),
                "id": "re621-imagescaler-fullscreen",
            })
            .addClass("button btn-neutral")
            .html("Fullscreen")
            .appendTo(resizeButtonContainer);

        this.image.click(async () => {
            if (!this.fetchSettings("clickScale") || await Danbooru.Note.TranslationMode.active()) return;
            this.setScale("", false);
        });

    }

    /**
     * Sets a new scale for the post image
     * @param size New size. If none specified, cycles to the next in the list
     * @param save Set to false to prevent saving the scale to settings
     */
    private setScale(size = "", save = true): void {
        const selector = ModuleController.get(ImageScaler).resizeSelector;
        if (size === "") {
            const $next = selector.find("option:selected").next();
            if ($next.length > 0) { size = $next.val() + ""; }
            else { size = selector.find("option").first().val() + ""; }
        }

        selector.val(size).trigger("change", save);
    }

    /**
     * Set the page image to the specified size
     * @param size sample, fit-gorizontal, fit-vertical, or original
     */
    private setImageSize(size: string): void {
        this.image.removeClass();
        this.image.parent().addClass("loading");

        this.image.on("load", () => {
            Danbooru.Note.Box.scale_all();
            this.image.parent().removeClass("loading");
        });

        switch (size) {
            case ("sample"): {
                this.image.attr("src", this.post.getSampleURL());
                break;
            }
            case ("fit-vertical"): {
                this.image.addClass("re621-fit-vertical");
                if (this.image.attr("src") !== this.post.getImageURL()) {
                    this.image.attr("src", this.post.getImageURL());
                } else { this.image.parent().removeClass("loading"); }
                break;
            }
            case ("fit-horizontal"): {
                this.image.addClass("re621-fit-horizontal");
                if (this.image.attr("src") !== this.post.getImageURL()) {
                    this.image.attr("src", this.post.getImageURL());
                } else { this.image.parent().removeClass("loading"); }
                break;
            }
            case ("original"): {
                if (this.image.attr("src") !== this.post.getImageURL()) {
                    this.image.attr("src", this.post.getImageURL());
                } else { this.image.parent().removeClass("loading"); }
                break;
            }
        }

        Danbooru.Note.Box.scale_all();
    }

    /** Opens the post in fullscreen mode */
    private openFullscreen(): void {
        $("#re621-imagescaler-fullscreen")[0].click();
    }

}
