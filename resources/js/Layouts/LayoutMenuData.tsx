import React, { useEffect, useState } from "react";

const Navdata = () => {
    const [isDashboard, setIsDashboard] = useState<boolean>(false);
    const [iscurrentState, setIscurrentState] = useState('Dashboard');

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== 'Dashboard') {
            setIsDashboard(false);
        }
    }, [
        iscurrentState,
        isDashboard
    ]);

    const menuItems : any = [
        {
            label: "Menu",
            isHeader: true,
        },
        {
            id: "dashboard",
            label: "Tablero Principal",
            icon: "ri-dashboard-2-line",
            link: "/dashboard",
        },
        {
            label: "Administración",
            isHeader: true,
        },
        {
            id: "usuarios",
            label: "Usuarios (Admin)",
            icon: "ri-group-line",
            link: "/users",
        },
        {
            id: "importador",
            label: "Importar Excel",
            icon: "ri-file-excel-2-line",
            link: "/import",
        },
        {
            id: "catalogos",
            label: "Catálogos Oficiales",
            icon: "ri-book-mark-line",
            link: "/catalog",
        },
        {
            id: "orphans",
            label: "Asignación Manual",
            icon: "ri-links-line",
            link: "/orphans",
        },
        {
            id: "indicadores",
            label: "Administrar Indicadores",
            icon: "ri-bar-chart-box-line",
            link: "/admin/indicadores",
        },
        {
            id: "misiones",
            label: "Administrar Misiones",
            icon: "ri-flag-line",
            link: "/admin/misiones",
        }
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;