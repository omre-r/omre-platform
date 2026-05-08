// This component ensure that when a user navigates to a new page, the scroll position resets to the top of the page.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  // Whenever the pathname changes (i.e., user navigates to a new page), scroll to the top of the page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;
