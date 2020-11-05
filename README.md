# dlopen

Dynamically load external libraries as required.

# How to use

To ensure proper functioning, register your libraries in the `init` or `setup` hooks. You can use `Dlopen.register` for that, which is well documented.

To load a registered dependency, you can use `Dlopen.loadDependencies` which takes an array of dependency names.

## Dlopen.register

```js
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
```

# License

This Foundry VTT module, writen by KaKaRoTo, for [The Forge](https://forge-vtt.com), is licensed under a [Creative Commons Attribution-NonCommercial 2.0 Generic License](https://creativecommons.org/licenses/by-nc/2.0/).
