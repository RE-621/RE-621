import { Modal } from "../../components/structure/Modal";
import { RE6Module, Settings } from "../../components/RE6Module";
import { User } from "../../components/data/User";
import { Form } from "../../components/structure/Form";
import { Page } from "../../components/data/Page";
import { SettingsController } from "./SettingsController";

/**
 * HeaderCustomizer  
 * Add, remove, and re-arrange the tabs in the customizable navbar
 */
export class HeaderCustomizer extends RE6Module {

    private $oldMenu: JQuery<HTMLElement>;
    private $menu: JQuery<HTMLElement>;

    private updateTabModal: Modal;
    private updateTabForm: Form;

    private addTabButton: HeaderTabElement;
    private addTabModal: Modal;
    private addTabForm: Form;

    public constructor() {
        super();
        this.registerHotkeys(
            { keys: "hotkeyTab1", fnct: this.openTabNum },
            { keys: "hotkeyTab2", fnct: this.openTabNum },
            { keys: "hotkeyTab3", fnct: this.openTabNum },
            { keys: "hotkeyTab4", fnct: this.openTabNum },
            { keys: "hotkeyTab5", fnct: this.openTabNum },
            { keys: "hotkeyTab6", fnct: this.openTabNum },
            { keys: "hotkeyTab7", fnct: this.openTabNum },
            { keys: "hotkeyTab8", fnct: this.openTabNum },
            { keys: "hotkeyTab9", fnct: this.openTabNum },
        );
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return {
            enabled: true,
            hotkeyTab1: "1",
            hotkeyTab2: "2",
            hotkeyTab3: "3",
            hotkeyTab4: "4",
            hotkeyTab5: "5",
            hotkeyTab6: "6",
            hotkeyTab7: "7",
            hotkeyTab8: "8",
            hotkeyTab9: "9",
            tabs: [
                { name: "Account", href: "/users/home" },
                { name: "Posts", href: "/posts" },
                { name: "Comments", href: "/comments?group_by=post" },
                { name: "Artists", href: "/artists" },
                { name: "Tags", href: "/tags" },
                { name: "Blips", href: "/blips" },
                { name: "Pools", href: "/pools" },
                { name: "Sets", href: "/post_sets" },
                { name: "Wiki", href: "/wiki_pages?title=help%3Ahome" },
                { name: "Forum", href: "/forum_topics" },
                { name: "Discord", href: "/static/discord" },
                { name: "Help", href: "/help" },
                { name: "More »", href: "/static/site_map" },
            ]
        };
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        if (!this.canInitialize()) return;
        super.create();

        this.$menu = $("menu.main");
        this.createDOM();

        // Configuration Form Listeners
        this.addTabForm.get().on("re621:form:submit", (event, data) => {
            event.preventDefault();
            this.addTab({
                name: data.get("name"),
                title: data.get("title"),
                href: data.get("href"),
            });
            this.addTabForm.reset();
        });

        this.updateTabForm.get().on("re621:form:submit", (event, data) => {
            event.preventDefault();
            this.updateTab(
                this.updateTabModal.getActiveTrigger().parent(),
                {
                    name: data.get("name"),
                    title: data.get("title"),
                    href: data.get("href"),
                }
            );
            this.updateTabModal.close();
        });

        this.updateTabForm.getInputList().get("delete").click(event => {
            event.preventDefault();
            this.deleteTab(this.updateTabModal.getActiveTrigger().parent());
            this.updateTabModal.close();
        });

        this.addTabModal.getElement().on("dialogopen", () => { this.enableEditingMode(); });
        this.addTabModal.getElement().on("dialogclose", () => { this.disableEditingMode(); });
    }

    public destroy(): void {
        if (!this.isInitialized()) return;
        super.destroy();
        this.$menu.removeClass("custom").empty();

        this.$menu.sortable("destroy");
        this.addTabButton.tab.remove();
        this.addTabModal.destroy();
        this.updateTabModal.destroy();

        this.$oldMenu.children().appendTo(this.$menu);
    }

    /**
     * Builds basic structure for the module
     */
    private createDOM(): void {
        this.$oldMenu = $("<div>").css("display", "none").appendTo("body");
        this.$menu.children().appendTo(this.$oldMenu);
        this.$menu.addClass("custom");

        // Fetch stored data
        this.fetchSettings("tabs").forEach(value => {
            this.createTabElement({
                name: value.name,
                href: value.href,
            });
        });

        this.$menu.sortable({
            axis: "x",
            containment: "parent",
            helper: "clone",
            forceHelperSize: true,
            opacity: 0.75,
            cursor: "grabbing",

            disabled: true,

            update: () => { this.saveNavbarSettings(); },
        });

        // === Tab Configuration Interface
        this.addTabButton = this.createTabElement({
            name: `<i class="fas fa-tasks"></i>`,
            parent: "menu.extra",
            class: "float-left",
            controls: false,
        });

        this.addTabForm = new Form(
            {
                id: "header-addtab",
                parent: "re-modal-container",
            },
            [
                { id: "name", label: "Name", type: "input", required: true, pattern: "[\\S ]+", },
                { id: "title", label: "Hover", type: "input" },
                { id: "href", label: "Link", type: "input" },
                { id: "submit", value: "Submit", type: "submit", stretch: "column" },
                { id: "help-hr", type: "hr" },
                { id: "help-var", value: "Available variables:", type: "div" },
                { id: "help-var-userid", label: "Unique ID", value: "%userid%", type: "copy" },
                { id: "help-var-username", label: "Username", value: "%username%", type: "copy" },
                { id: "info-hr", type: "hr" },
                { id: "info-div", value: "Drag-and-drop tabs to re-arrange.<br />Click on a tab to edit it.", type: "div" },
            ]
        );

        this.addTabModal = new Modal({
            title: "Add Tab",
            triggers: [{ element: this.addTabButton.link }],
            content: this.addTabForm.get(),
            position: { my: "right top", at: "right top" }
        });

        // Tab Update Interface
        this.updateTabForm = new Form(
            {
                id: "header-updatetab",
                parent: "re-modal-container",
            },
            [
                { id: "name", label: "Name", type: "input", required: true, pattern: "[\\S ]+", },
                { id: "title", label: "Hover", type: "input" },
                { id: "href", label: "Link", type: "input" },
                { id: "delete", value: "Delete", type: "button" },
                { id: "submit", value: "Update", type: "submit" },
            ]
        );

        this.updateTabModal = new Modal({
            title: "Update Tab",
            triggers: [{ element: $("menu.main li a") }],
            content: this.updateTabForm.get(),
            position: { my: "center top", at: "center top" },
            triggerMulti: true,
            disabled: true,
        });
    }

    /**
     * Turns on editing mode on the header
     */
    private enableEditingMode(): void {
        this.$menu.attr("data-editing", "true");
        this.$menu.sortable("enable");
        this.updateTabModal.enable();

        // Fill in update tab data
        this.updateTabModal.getElement().on("dialogopen", () => {
            const $tab = this.updateTabModal.getActiveTrigger().parent();
            const $updateTabInputs = this.updateTabForm.getInputList();

            $updateTabInputs.get("name").val($tab.attr("data-name"));
            $updateTabInputs.get("title").val($tab.attr("data-title"));
            $updateTabInputs.get("href").val($tab.attr("data-href"));
        });
    }

    /**
     * Turns off the header editing mode
     */
    private disableEditingMode(): void {
        this.$menu.attr("data-editing", "false");
        this.$menu.sortable("disable");

        this.updateTabModal.close();
        this.updateTabModal.disable();
    }

    /**
     * Creates a new styled tab
     * @param config Tab configuration
     */
    public createTabElement(config: HeaderTab, triggerUpdate?: boolean): HeaderTabElement {
        config = this.parseHeaderTabConfig(config);
        if (triggerUpdate === undefined) triggerUpdate = false;

        const $tab = $(`<li>`)
            .attr("data-name", config.name)
            .attr("data-title", config.title)
            .attr("data-href", config.href)
            .appendTo($(config.parent));
        const $link = $("<a>")
            .html(this.processTabVariables(config.name))
            .attr("title", this.processTabVariables(config.title))

            .appendTo($tab);

        if (config.href != "")
            $link.attr("href", this.processTabVariables(config.href));

        if (config.controls) { $tab.addClass("configurable"); }
        if (config.class) { $tab.addClass(config.class); }
        if (triggerUpdate) { this.saveNavbarSettings(); }

        if (Page.getURL().pathname.includes(this.processTabVariables(config.href).split("?")[0])) {
            $tab.addClass("active");
        }

        return { tab: $tab, link: $link };
    }

    /**
     * Parses the provided configuration file for missing values
     * @param config Configuration to process
     */
    private parseHeaderTabConfig(config: HeaderTab): HeaderTab {
        if (config.name === undefined) config.name = "New Tab";
        if (config.href === undefined) config.href = "";
        if (config.title === undefined) config.title = "";

        if (config.class === undefined) config.class = "";
        if (config.parent === undefined) config.parent = "menu.main";
        if (config.controls === undefined) config.controls = true;

        return config;
    }

    /**
     * Creates a new tab based on specified configuration
     * @param config Configuration
     */
    private addTab(config: HeaderTab): void {
        config = this.parseHeaderTabConfig(config);
        const newTab = this.createTabElement(config, true);
        this.updateTabModal.registerTrigger({ element: newTab.link });
    }

    /**
     * Update the specified tab with the corresponding configuration
     * @param $element Tab to update
     * @param config New configuration
     */
    private updateTab($element: JQuery<HTMLElement>, config: HeaderTab): void {
        config = this.parseHeaderTabConfig(config);
        $element
            .attr("data-name", config.name)
            .attr("data-title", config.title)
            .attr("data-href", config.href);
        $element.find("a").first()
            .html(this.processTabVariables(config.name))
            .attr("title", this.processTabVariables(config.title))
            .attr("href", this.processTabVariables(config.href));
        this.saveNavbarSettings();
    }

    /**
     * Remove the specified tab
     * @param $element LI element of the tab
     */
    private deleteTab($element: JQuery<HTMLElement>): void {
        $element.remove();
        this.saveNavbarSettings();
    }

    /**
     * Replaces the variables in the text with corresponding values
     * @param text Text to parse
     */
    private processTabVariables(text: string): string {
        return text
            .replace(/%userid%/g, User.getUserID() + "")
            .replace(/%username%/g, User.getUsername());
    }

    /**
     * Iterates over the header menu and saves the data to cookies
     */
    private saveNavbarSettings(): void {
        const tabData = [];
        this.$menu.find("li").each(function (i, element) {
            const $tab = $(element);
            tabData.push({
                name: $tab.attr("data-name"),
                title: $tab.attr("data-title"),
                href: $tab.attr("data-href"),
            });
        });
        this.pushSettings("tabs", tabData);
    }

    private openTabNum(event, key: string): void {
        const tabs = SettingsController.getModule<HeaderCustomizer>(HeaderCustomizer).$menu.find("li > a");
        if (parseInt(key) > tabs.length) return;
        tabs[parseInt(key) - 1].click();
    }

}

export interface HeaderTabElement {
    tab: JQuery<HTMLElement>;
    link: JQuery<HTMLElement>;
}

interface HeaderTab {
    /** Text inside the link */
    name?: string;
    /** Link address */
    href?: string;
    /** Hover text */
    title?: string;

    /** Extra class to append to the tab */
    class?: string;
    /** Element to append the tab to */
    parent?: string;
    /** Should the tab have controls in editing mode */
    controls?: boolean;
}
