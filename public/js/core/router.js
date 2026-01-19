
export class Router {
    constructor() {
        this.routes = {};
        this.callback = null;
        this.defaultRoute = 'dashboard';

        // Bind context
        this._handleHashChange = this._handleHashChange.bind(this);
    }

    /**
     * Define the callback to run when route changes
     * @param {Function} callback - Function(pageId)
     */
    onRoute(callback) {
        this.callback = callback;
    }

    /**
     * Initialize the router listeners
     */
    init() {
        window.addEventListener('hashchange', this._handleHashChange);
        window.addEventListener('load', this._handleHashChange);
    }

    _handleHashChange() {
        // Get hash, remove '#', handle empty/root as default
        let hash = window.location.hash.slice(1);

        if (!hash) {
            hash = this.defaultRoute;
            // Optionally update URL to reflect default without reloading
            // history.replaceState(null, null, `#${this.defaultRoute}`);
        }

        if (this.callback) {
            this.callback(hash);
        }
    }

    /**
     * Programmatic navigation
     * @param {string} pageId 
     */
    navigate(pageId) {
        window.location.hash = pageId;
    }
}
