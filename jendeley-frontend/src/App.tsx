import React, {useMemo} from 'react';
import Chip from '@mui/material/Chip';
import ReactDOM from 'react-dom/client'
import base_64 from 'base-64'
import './App.css';
import {Entry, DB} from './schema';
import MaterialReactTable, {MaterialReactTableProps, MRT_ColumnDef} from 'material-react-table';
import sanitizeHTML from 'sanitize-html';

function authorChips(authors: string[]) {
    // TODO padding or margine
    return (
        <div>
            {authors.map((a) =>
                <Chip label={`${a}`} size='small' />
            )}
        </div>
    )
}

function tagChips(tags: string[]) {
    // TODO padding or margine
    return (
        <div>
            {tags.map((a) =>
                <Chip label={`${a}`} size='small' />
            )}
        </div>
    )
}

function abstractHTML(abstract: string) {
    const __html = sanitizeHTML(abstract.replaceAll("<jats:", "<"));
    return <div dangerouslySetInnerHTML={{__html}}></div>;
}

function App() {
    const [tableData, setTableData] = React.useState<DB>([])

    React.useEffect(() => {
        console.log("Fetching from DB");
        fetch("http://localhost:5000/api/get_db")
            .then(response => response.json())
            .then(json => setTableData(() => json));
    }, []);

    const columns = useMemo<MRT_ColumnDef<Entry>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'id',
            },
            {
                accessorKey: 'title',
                Cell: ({cell, row}) => (<a href={`${"http://localhost:5000/api/get_pdf/?file=" + base_64.encode(escape(row.original.path))}`}>{`${cell.getValue()}`}</a>),
                header: 'title',
            },
            {
                accessorKey: 'path',
                header: 'path',
            },
            {
                accessorKey: 'authors',
                Cell: ({cell}) => (authorChips(cell.getValue<string[]>())),
                header: 'authors',
            },
            {
                accessorKey: 'tags',
                Cell: ({cell}) => (tagChips(cell.getValue<string[]>())),
                header: 'tags',
            },
            {
                accessorKey: 'comments',
                header: 'comments',
            },
            {
                accessorKey: 'year',
                header: 'year',
            },
            {
                accessorKey: 'publisher',
                header: 'publisher',
            },
            {
                accessorKey: 'abstract',
                Cell: ({cell}) => (abstractHTML(cell.getValue<string>())),
                header: 'abstract',
            },
        ],
        [],
    );

    const handleSaveRow: MaterialReactTableProps<Entry>['onEditingRowSave'] =
        async ({exitEditingMode, row, values}) => {
            // TODO: Ban editing fields other than "tags" and "comments".
            const edittedTags = values.tags.split(/[\s,]+/);
            const edittedComments = values.comments;
            tableData[row.index]["tags"] = edittedTags;
            tableData[row.index]["comments"] = edittedComments;

            const e: Entry = {abstract: "", authors: [], id: values.id, title: "", path: "", tags: edittedTags, comments: edittedComments, year: 0, publisher: ""};
            const response = await fetch("http://localhost:5000/api/update_entry", {
                method: 'PUT',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(e)
            });
            console.log("response of update_entry:", response);
            //send/receive api updates here
            setTableData([...tableData]);
            exitEditingMode(); //required to exit editing mode
        };

    return <MaterialReactTable
        columns={columns}
        data={tableData}
        enablePagination={false}
        initialState={{
            showColumnFilters: true,
            sorting: [{id: 'year', desc: true}],
            showGlobalFilter: true,
            columnVisibility: {id: false, path: false},
        }}
        positionGlobalFilter="left"
        enableStickyHeader
        globalFilterFn="contains"
        enableColumnResizing
        columnResizeMode="onEnd"
        editingMode="modal" //default
        enableEditing
        onEditingRowSave={handleSaveRow}
    />;
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)

export default App;
