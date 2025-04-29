import { loadNavbar } from "./navbar-loader.js";
import { loadFooter } from "./footer.js";

window.onload = function() {
    loadNavbar();
    loadFooter();
}