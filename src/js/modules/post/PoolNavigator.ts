import { RE6Module, Settings } from "../../components/RE6Module";
import { PageDefintion } from "../../components/data/Page";
import { SettingsController } from "../general/SettingsController";

export class PoolNavigator extends RE6Module {

    private activeNav = 0;
    private navbars: PostNav[] = [];

    public constructor() {
        super(PageDefintion.post);
        this.registerHotkeys(
            { keys: "hotkeyCycle", fnct: this.cycleNavbars },
            { keys: "hotkeyNext", fnct: this.triggerNextPost },
            { keys: "hotkeyPrev", fnct: this.triggerPrevPost },
        );
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return {
            enabled: true,
            hotkeyCycle: "x|.",
            hotkeyPrev: "a|left",
            hotkeyNext: "d|right",
        };
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        if (!this.canInitialize()) return;
        super.create();

        this.buildDOM();

        $("input[type='radio'].post-nav-switch").change((event) => {
            this.activeNav = parseInt($(event.target).val() + "");
        });

        this.registerHotkeys();
    }

    /** Loops through available navbars */
    private cycleNavbars(): void {
        const poolNavigator = SettingsController.getModule<PoolNavigator>(PoolNavigator);
        const navbars = poolNavigator.navbars,
            active = poolNavigator.activeNav;

        if ((active + 1) >= navbars.length) {
            navbars[0].checkbox.click();
            poolNavigator.activeNav = 0;
        } else {
            navbars[active + 1].checkbox.click();
            poolNavigator.activeNav += 1;
        }
    }

    /** Emulates a click on the "next" button */
    private triggerNextPost(): void {
        const poolNavigator = SettingsController.getModule<PoolNavigator>(PoolNavigator);
        const navbars = poolNavigator.navbars,
            active = poolNavigator.activeNav;
        if (navbars.length == 0) return;
        navbars[active].element.find("a.next").first()[0].click();
    }

    /** Emulates a click on the "prev" button */
    private triggerPrevPost(): void {
        const poolNavigator = SettingsController.getModule<PoolNavigator>(PoolNavigator);
        const navbars = poolNavigator.navbars,
            active = poolNavigator.activeNav;
        if (navbars.length == 0) return;
        navbars[active].element.find("a.prev").first()[0].click();
    }

    /** Creates the module structure */
    private buildDOM(): void {
        // Search-nav
        if ($("div#search-seq-nav").length) {
            this.navbars.push({ type: "search", element: $("div#search-seq-nav > ul > li").first(), checkbox: undefined, });
        }

        // Pool-navs
        $("div#pool-nav > ul > li").each((index, element) => {
            this.navbars.push({ type: "pool", element: $(element), checkbox: undefined, });
        });

        // Set-navs

        // Create checkboxes
        this.navbars.forEach((nav, index) => {
            nav.element.addClass("post-nav");

            const $radioBox = $("<div>")
                .addClass("post-nav-switch-box")
                .appendTo(nav.element);
            nav.checkbox = $("<input>")
                .attr("type", "radio")
                .attr("id", "post-nav-switch-" + index)
                .attr("name", "nav")
                .val(index)
                .addClass("post-nav-switch")
                .appendTo($radioBox);
            if (index === this.activeNav) nav.checkbox.attr("checked", "");
            $("<label>")
                .attr("for", "post-nav-switch-" + index)
                .appendTo($radioBox);
        });
    }
}

interface PostNav {
    type: "search" | "pool";
    element: JQuery<HTMLElement>;
    checkbox: JQuery<HTMLElement>;
}
