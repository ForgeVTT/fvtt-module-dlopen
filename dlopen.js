"use strict";
class Dlopen {
    static init() {
        game.settings.register("dlopen", "useCache", {
            name: game.i18n.localize("DLOPEN.UseCache"),
            hint: game.i18n.localize("DLOPEN.UseCacheHint"),
            scope: "world",
            config: false, /* NOT IMPLEMENTED */
            default: false,
            type: Boolean,
            onChange: () => this._updateCache()
        });
    }
    static ready() {
        this._updateCache();
    }
    
    /**
     * Register a new dependency for dynamic loading.
     * 
     * For the name, use a sensible name, making sure that the name doesn't conflict with another library or that the same library isn't loaded under two different names,
     * for example, 'vue'. Generally, try to stick to the npm package name.
     * You can specify styles and scripts as either a string or an array of strings, which can be any absolute URL or relative URL to your own module.
     * If you specify dependencies, those will be loaded first before this library is loaded. Be careful with cyclic loops, these are not supported.
     * You can also specify an init function to be called when the library is loaded. This function has to be generic, and only initiatilize the library itself, DO NOT use it as a callback to your own logic
     * as it can easily be overwritten by another module adding the same dependency. This is used specifically to initialize the script that was just loaded, for example, a 'vuex' dependency would
     * have an init that calls 'Vue.use'
     * 
     * Examples:
     * Dlopen.register('vue', {scripts: "https://cdn.jsdelivr.net/npm/vue/dist/vue.min.js"})
     * Dlopen.register('vuex', {
     *   scripts: "https://unpkg.com/vuex@2.0.0/dist/vuex.min.js",
     *   dependencies: "vue",
     *   init: () => Vue.use(Vuex)
     * })
     * 
     * @param {String} name                The name of the dependency.
     * @param {Array|String} scripts       The script or scripts to load when this dependency is loaded. You can use any URL (cdnjs, unpkg) as well as local paths ("/modules/yourmodule/libs/filename.js")
     * @param {Array|String} styles        The CSS style or styles to load when this dependency is loaded. You can use any URL (cdnjs, unpkg) as well as local paths ("/modules/yourmodule/libs/filename.css")
     * @param {Array|String} dependencies  The name of names any dependencies this library depends on
     * @param {Function} init              A function to call to initialize the library, once the scripts are loaded. 
     */
    static register(name, {scripts, styles, dependencies, init}={}) {
        this.DEPENDENCIES[name] = {scripts, styles, dependencies, init}
    }
    
    /**
     * Load the specified dependencies
     * 
     * @param {Array} dependencies      List of dependency names to load
     * @return {Promise}
     */
    static async loadDependencies(dependencies) {
        for (let dep of dependencies) {
            if (!this.DEPENDENCIES[dep]) {
                ui.notifications.warn(`Could not load unknown dependency '${dep}'`);
                continue;
            }
            
            // To avoid race condition, save the promise and alway await it
            if (!this.LOADED_DEPENDENCIES[dep])
                this.LOADED_DEPENDENCIES[dep] = this._loadDependency(dep);
            await this.LOADED_DEPENDENCIES[dep];
        }
    }
    
    /* Hash a string and return its hex digest */
    static async hash(data) {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(data);
        const hash = await crypto.subtle.digest('SHA-256', buffer);
        return this.ArrayBufferToHex(hash);
    }
    static ArrayBufferToHex(ab) {
        return Array.from(new Int8Array(ab), function(byte) {
            return (byte & 0xFF).toString(16).padStart(2, "0")
          }).join('')
    }

    /* Update the local cache of all registered dependencies */
    static async _updateCache() {
        if (!game.settings.get("dlopen", "useCache")) return;
        if (typeof(ForgeVTT) !== "undefined" && ForgeVTT.usingTheForge) return;
    }
    
    static async _loadDependency(dep) {
        let {scripts, styles, dependencies, init} = this.DEPENDENCIES[dep];
        // Recursively load dependencies. Cycles are NOT supported!!
        if (dependencies) {
            if (typeof(dependencies) === "string") dependencies = [dependencies];
            await this.loadDependencies(dependencies)
        }
        // Load scripts
        if (scripts) {
            if (typeof(scripts) === "string") scripts = [scripts];
            for (let script of scripts) {
                await this.loadScript(script);
            }
        }
        // Load styles
        if (styles) {
            if (typeof(styles) === "string") styles = [styles];
            for (let style of styles) {
                await this.loadCss({url: style});
            }
        }
        // Init the dependency if needed
        if (init)
            await init();
        console.log("Dlopen: Loaded dependency : ", dep)
    }

    static async loadScript(url) {
        return new Promise((resolve, reject) => {
            const head = document.getElementsByTagName('head')[0];
            const script = document.createElement('script');
            script.onload = resolve;
            script.onerror = reject;
            script.src = url;
            head.appendChild(script);
        });
    }
    
    static async loadCss({url, content}={}) {
        const head = document.getElementsByTagName('head')[0];
        this.loadedCss = this.loadedCss || new Set();
        
        if (content) {
            const hash = await this.hash(content);
            if (this.loadedCss.has(hash)) return;
            this.loadedCss.add(hash);
            const style  = document.createElement('style');
            style.type = 'text/css';
            
            if (style.styleSheet)
                style.styleSheet.cssText = content;
            else
                style.innerHTML = content;
    
            head.appendChild(style);
        } else if (url) {
            if (this.loadedCss.has(url)) return;
            this.loadedCss.add(url);
            const link  = document.createElement('link');
            link.href = url;
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            
            return new Promise((resolve, reject) => {
                link.onload = resolve;
                link.onerror = reject;
                head.appendChild(link);
            });
        } else {
            throw new Error("'url' or 'content' argument required");
        }
    }
}

Dlopen.DEPENDENCIES = {};
Dlopen.LOADED_DEPENDENCIES = {};
Hooks.on('init', () => Dlopen.init());
Hooks.on('ready', () => Dlopen.ready());