import React, { Suspense } from "react";
import { useContext, useState } from "react";
import DnsIcon from "@material-ui/icons/Dns";
import Box from "@material-ui/core/Box";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Toast from "../Toast";
import useActiveQueryEditor from "../../hooks/useActiveQueryEditor";
import QueryResultTable from "../../Components/QueryResultTable";
import useToast from "../../hooks/useToast";
import PropTypes from "prop-types";
import { DEFAULT_STRINGS, noop } from "../../utils/constants/common";
import {
  TOAST_ERROR,
  TOAST_SUCCESS,
} from "../../utils/constants/ToastConstants";
import { v4 as uuid } from "uuid";
import EditorControls from "./EditorControls";
import EditorLoader from "./EditorLoader";
import axios from "axios";
import { AppContextProvider, AppContext } from "../../context/AppContext";
import EmptyState from "../../Components/EmptyState";
// Lazy loading Editor
const LazyEditor = React.lazy(() => import("./LazyEditor"));
const useStyles = makeStyles((theme) => ({
  editorStyles: {
    border: `1px solid ${theme.palette.divider}`,
    borderRight: "0",
  },
}));

const QueryEditor = ({ onRunQuery = noop }) => {
  const classes = useStyles();
  const { database } = useContext(AppContext);
  const [queryResults, setQueryResults] = useState();
  const { currentQuery, handleQueryChange, editorTabs, updateEditorTabs } =
    useActiveQueryEditor();
  const { isToastVisible, showToast, toastType, toastMessage } = useToast();

  const handleRunQuery = async () => {
    console.log("database name Query editor", database);
    if (!currentQuery) {
      showToast(TOAST_ERROR, "Please Enter Query");
      return;
    }

    try {
      const response = await axios
        .post("https://localhost:7010/api/exportQuery", {
          databaseName: database,
          query: currentQuery, // Permite trimiterea cookie-urilor
        })
        .then((response) => setQueryResults(response.data))
        .catch((error) => console.log(error));

      // Aici puteți manipula răspunsul primit de la backend, în funcție de necesități
      // De exemplu, puteți afișa rezultatul într-un toast sau alt element

      showToast(TOAST_SUCCESS, "Query Ran Successfully");
    } catch (error) {
      console.error("Error running query:", error);
      showToast(TOAST_ERROR, "Error running query");
    }
  };

  const handleExport = (format) => {
    console.log("formattttttttt", format);
    const data = queryResults;
    if (!data) {
      showToast(TOAST_ERROR, "No data to export");
      return;
    }
    if (format === "SQL Query") {
      const blob = new Blob([currentQuery], { type: "text/sql" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.download = "query.sql";
      a.href = url;
      a.click();
      a.remove();
      return; // să iesim din funcție după export
    }
    if (format === "CSV File") {
      // Convertește datele în format CSV
      const csvData = dataToCSV(data);

      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.download = "data.csv";
      a.href = url;
      a.click();
      a.remove();
    } else if (format === "JSON File") {
      // Cod pentru export în JSON
      const json = JSON.stringify(data);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = "data.json";
      a.href = url;
      a.click();
      a.remove();
    }
  };
  function dataToCSV(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return "";
    }

    const header = Object.keys(data[0]).join(",");
    const rows = data.map((obj) => Object.values(obj).join(",")).join("\n");

    return header + "\n" + rows;
  }
  return (
    <AppContextProvider>
      <Box display="flex" height="100%" width="100%" flexDirection="column">
        <Box>
          <EditorControls
            editorTabs={editorTabs}
            updateEditorTabs={updateEditorTabs}
            onRunQuery={handleRunQuery}
            onExport={handleExport}
          />

          <Suspense fallback={<EditorLoader />}>
            <LazyEditor
              aria-label="query editor input"
              mode="mysql"
              theme="tomorrow"
              name={uuid()}
              fontSize={16}
              maxLines={6}
              minLines={6}
              width="100%"
              showPrintMargin={false}
              showGutter
              highlightActiveLine={false}
              placeholder={DEFAULT_STRINGS.QUERY_EDITOR_PLACEHOLDER}
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
              }}
              value={currentQuery}
              onChange={handleQueryChange}
              className={classes.editorStyles}
              showLineNumbers
            />
          </Suspense>
          <Toast
            show={isToastVisible}
            type={toastType}
            message={toastMessage}
          />
        </Box>
        {!queryResults ? (
          <EmptyState
            icon={<DnsIcon fontSize="large" />}
            title={DEFAULT_STRINGS.WELCOME_MESSAGE_TITLE}
            subtitle={DEFAULT_STRINGS.WELCOME_MESSAGE_SUBTITLE}
          />
        ) : (
          //console.log("query result", queryResults) &
          <QueryResultTable tableData={{ rows: queryResults }} />
        )}
      </Box>
    </AppContextProvider>
  );
};

export default QueryEditor;

QueryEditor.propTypes = {
  onRunQuery: PropTypes.func.isRequired,
};
