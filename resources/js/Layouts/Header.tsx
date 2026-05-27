import { Link } from "@inertiajs/react";
import React, { useState } from "react";

//import images
import logoSm from "../../images/logo-sm.png";
import campecheLogo from "../../images/campeche-logo.png";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { Dropdown, Form } from "react-bootstrap";
import { changeSidebarVisibility } from "../slices/thunk";
import ProfileDropdown from "../Components/Common/ProfileDropdown";

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }: any) => {
    const dispatch : any = useDispatch();


    const selectDashboardData = createSelector(
        (state:any) => state.Layout,
        (sidebarVisibilitytype:any) => sidebarVisibilitytype.sidebarVisibilitytype
      );
    // Inside your component
    const sidebarVisibilitytype = useSelector(selectDashboardData);


    const [search, setSearch] = useState<boolean>(false);
    const toogleSearch = () => {
        setSearch(!search);
    };

    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;
        const humberIcon = document.querySelector(".hamburger-icon") as HTMLElement;
        dispatch(changeSidebarVisibility("show"));

        if (windowSize > 767)
            humberIcon.classList.toggle('open');

        //For collapse horizontal menu
        if (document.documentElement.getAttribute('data-layout') === "horizontal") {
            document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
        }

    //For collapse vertical and semibox menu
    if (sidebarVisibilitytype === "show" && (document.documentElement.getAttribute('data-layout') === "vertical" || document.documentElement.getAttribute('data-layout') === "semibox")) {
        if (windowSize < 1025 && windowSize > 767) {
            document.body.classList.remove('vertical-sidebar-enable');
            (document.documentElement.getAttribute('data-sidebar-size') === 'sm') ? document.documentElement.setAttribute('data-sidebar-size', '') : document.documentElement.setAttribute('data-sidebar-size', 'sm');
        } else if (windowSize > 1025) {
            document.body.classList.remove('vertical-sidebar-enable');
            (document.documentElement.getAttribute('data-sidebar-size') === 'lg') ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg');
        } else if (windowSize <= 767) {
            document.body.classList.add('vertical-sidebar-enable');
            document.documentElement.setAttribute('data-sidebar-size', 'lg');
        }
    }


    //Two column menu
        if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
            document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
        }
    };
    return (
        <React.Fragment>
            <header id="page-topbar" className={headerClass}>
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex">

                            <div className="navbar-brand-box horizontal-logo">
                                <Link href="/" className="logo logo-dark">
                                    <span className="logo-sm">
                                        <img src={campecheLogo} alt="" height="22" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={campecheLogo} alt="" height="35" />
                                    </span>
                                </Link>

                                <Link href="/" className="logo logo-light">
                                    <span className="logo-sm">
                                        <img src={campecheLogo} alt="" height="22" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={campecheLogo} alt="" height="35" />
                                    </span>
                                </Link>
                            </div>

                            <button
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                id="topnav-hamburger-icon">
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>


                            {/* ProfileDropdown */}
                            <ProfileDropdown />
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    )
}
export default Header;