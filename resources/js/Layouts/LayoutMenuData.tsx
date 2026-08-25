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
            id: "indicadores",
            label: "Administrar Indicadores",
            icon: "ri-bar-chart-box-line",
            link: "/admin/indicadores",
        },
        {
            id: "misiones",
            label: "Administrar Misiones",
            icon: "ri-flag-2-line",
            link: "/admin/misiones",
        },
        {
            id: "exportaciones",
            label: "Exportaciones",
            icon: "ri-download-cloud-line",
            link: "/admin/exportaciones",
        }
    ];

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;