import React from 'react'

import { Container } from 'react-bootstrap'
import TasksKanban from './MainPage'
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { Head } from '@inertiajs/react';
import Layout from '../../../Layouts';




const Kanbanboard = () => {

    return (
        <React.Fragment>
            <Head title = "Kanban Board | 5to Informe de Gobierno"/>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Kanban Board" pageTitle="Tasks" />
                    <TasksKanban />
                </Container>
            </div>
        </React.Fragment>


    )
}
Kanbanboard.layout = (page:any) => <Layout children={page}/>
export default Kanbanboard

