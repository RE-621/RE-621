import { Page } from "./data/Page";
import { Hotkeys } from "./data/Hotkeys";

declare const GM_getValue;
declare const GM_setValue;

/**
 * Class that other modules extend.  
 * Provides methods to save and load settings from cookies.
 */
export class RE6Module {

    private static instance: RE6Module;

    private settings: Settings;
    private readonly prefix: string = this.constructor.name;

    private enabled: boolean;
    private initialized = false;

    private constraint: RegExp[] = [];
    private hotkeys: Hotkey[] = [];

    protected constructor(constraint?: RegExp | RegExp[]) {
        if (constraint === undefined) this.constraint = [];
        else if (constraint instanceof RegExp) this.constraint.push(constraint);
        else this.constraint = constraint;

        this.loadSettingsData();

        // Save if the module is active or not
        // If no enabled settings is found, assume the module is active
        const status = this.fetchSettings("enabled");
        this.enabled = status === undefined ? true : status;
    }

    /** Returns true if the module has already been initialized */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /** Checks if the module should call the init function */
    public canInitialize(): boolean {
        return !this.initialized && this.pageMatchesFilter() && this.enabled;
    }

    /**
     * Evaluates whether the module should be executed.
     * @returns true if the page matches the constraint, false otherwise.
     */
    private pageMatchesFilter(): boolean {
        return this.constraint.length == 0 || Page.matches(this.constraint);
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        this.initialized = true;
    }

    /**
     * Removes the module's structure.  
     * Must clean up everything that create() has added.
     */
    public destroy(): void {
        this.initialized = false;
    }

    /**
     * Returns the module's current state
     * @returns True if the module is enabled, false otherwise
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Sets the module's enabled / disabled state
     * @param enabled True to enable, False to disable
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Fetches the specified settings property
     * @param property Property name
     * @param fresh Fetches some freshly baked cookies
     * @returns Property value
     */
    public fetchSettings(property?: string, fresh?: boolean): any {
        if (fresh) this.loadSettingsData();
        if (property === undefined) return this.settings;
        if (this.settings[property] === undefined) {
            debugger;
        }
        return this.settings[property];
    }

    /**
     * Saves the specified settings property-value pair
     * @param property Property name
     * @param value Property value
     * @param preserve Ensures that all other values are preserved
     */
    public pushSettings(property: string, value: any, preserve?: boolean): void {
        if (preserve) { this.loadSettingsData(); }
        this.settings[property] = value;
        this.saveSettingsData();
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return { enabled: true };
    }

    /**
     * Loads settings values from cookies if they exist.  
     * Otherwise, loads the default values
     */
    private loadSettingsData(): void {
        const defaultValues = this.getDefaultSettings();
        this.settings = GM_getValue("re621." + this.prefix, defaultValues);

        // If defaultValues has a entry the defaultSettings do not have, add it
        // this might happen if the user saved and a defaultSetting gets added afterwards
        for (const key of Object.keys(defaultValues)) {
            if (this.settings[key] === undefined) {
                this.settings[key] = defaultValues[key];
            }
        }
    }

    /**
     * Saves the settings to cookies
     */
    private saveSettingsData(): void {
        GM_setValue("re621." + this.prefix, this.settings);
    }

    /**
     * @returns the class name of the module
     */
    public getPrefix(): string {
        return this.prefix;
    }

    /** Establish the module's hotkeys */
    public resetHotkeys(): void {
        const enabled = this.pageMatchesFilter();
        this.hotkeys.forEach((value) => {

            const keys = this.fetchSettings(value.keys, true) as string;
            keys.split("|").forEach((key) => {
                if (enabled) Hotkeys.register(key, value.fnct);
                else Hotkeys.register(key, () => { return; });
            });
        });
    }

    /**
     * Registers the provided hotkeys with the module
     * @param hotkeys Hotkey to register
     */
    protected registerHotkeys(...hotkeys: Hotkey[]): void {
        this.hotkeys = this.hotkeys.concat(hotkeys);
        this.resetHotkeys();
    }

    /**
 * Returns a singleton instance of the class
 * @returns FormattingHelper instance
 */
    public static getInstance(): RE6Module {
        if (this.instance == undefined) this.instance = new this();
        return this.instance;
    }

}

interface Hotkey {
    keys: string;
    fnct: Function;
}

export type Settings = {
    enabled: boolean;
} & {
    [prop: string]: any;
};
