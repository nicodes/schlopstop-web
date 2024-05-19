import navStyles from "../nav/nav.module.scss";

export const navId = "nav";
export const getNav = () => document.getElementById(navId);

export const navClickCatcherId = "nav-click-catcher";
export const getNavClickCatcher = () =>
  document.getElementById(navClickCatcherId);

export const navButtonId = "nav-button";
export const getNavButton = () => document.getElementById(navButtonId);

function navOpen() {
  const nav = getNav();
  if (!nav) return;

  nav.classList.add(navStyles.navOpen);
}

function navClose() {
  const nav = getNav();
  if (!nav) return;

  nav.classList.remove(navStyles.navOpen);
}

export function navIsOpen() {
  const nav = getNav();
  if (!nav) return;

  return nav.classList.contains(navStyles.navOpen);
}

export function navToggle(state?: "open" | "close") {
  if (state === "open") return navOpen();
  if (state === "close") return navClose();

  navIsOpen() ? navClose() : navOpen();
}
