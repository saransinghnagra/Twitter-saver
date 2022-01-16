import React, { useState, useEffect, useReducer } from "react";
import ReactDOM from "react-dom";
import "@atlaskit/css-reset";
import styled from "styled-components";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import apiData from "./initial-data";
import Column from "./column";
import Header from "./Header";
import { modifyData } from "./helper";
import Search from "./Search";
import "./App.css";

const Container = styled.div`
  display: flex;
`;

function InnerList(props) {
  const { column, taskMap, index } = props;
  const tasks = column.taskIds.map((taskId) => taskMap[taskId]);
  return <Column column={column} tasks={tasks} index={index} />;
}

const TWITTER_API_URL = "/api";

const initialState = {
  loading: true,
  tweets: [],
  errorMessage: null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "SEARCH_TWEETS_REQUEST":
      return {
        ...state,
        loading: true,
        errorMessage: null,
      };
    case "SEARCH_TWEETS_SUCCESS":
      return {
        ...state,
        loading: false,
        tweets: action.payload,
      };
    case "SEARCH_TWEETS_FAILURE":
      return {
        ...state,
        loading: false,
        errorMessage: action.error,
      };
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [initialData, setInitialData] = useState(apiData);
  const [columnOrder, setColumnOrder] = useState(apiData?.columnOrder);
  const [columns, setColumns] = useState(apiData?.columns);

  useEffect(() => {
    fetch(TWITTER_API_URL, {
      body: JSON.stringify({ q: "banana", count: 4 }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((jsonResponse) => {
        console.log(jsonResponse.data.statuses);
        dispatch({
          type: "SEARCH_TWEETS_SUCCESS",
          payload: jsonResponse.data.statuses,
        });
      });
  }, []);

  const search = (searchValue) => {
    dispatch({
      type: "SEARCH_TWEETS_REQUEST",
    });

    fetch(TWITTER_API_URL, {
      body: JSON.stringify({ q: `${searchValue}`, count: 4 }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((jsonResponse) => {
        if (jsonResponse?.data?.statuses) {
          dispatch({
            type: "SEARCH_TWEETS_SUCCESS",
            payload: jsonResponse.data.statuses,
          });
        } else {
          dispatch({
            type: "SEARCH_TWEETS_FAILURE",
            error: jsonResponse.data.errors,
          });
        }
      });
  };

  console.log("initialData", state);

  const modifiedData = modifyData(state);
  useEffect(() => {
    if (window.performance) {
      if (performance.navigation.type === 1) {
        if (localStorage !== null) {
          const localStorageData = JSON.parse(localStorage.getItem("data"));
          {
            localStorageData.map((columnId, index) => {
              return (
                <InnerList
                  key={columnId.id}
                  column={"column-2"}
                  taskMap={columnId}
                  index={index}
                />
              );
            });
          }
        }
      }
    }
  }, []);

  const dataInLocal = [];
  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    if (destination?.droppableId === "column-2") {
      if (localStorage.length) {
        const storage = JSON.parse(localStorage.getItem("data"));
        console.log("storage", storage);
        storage.push(initialData?.tasks[draggableId]);
        localStorage.setItem("data", JSON.stringify(storage));
      } else {
        dataInLocal.push(initialData?.tasks[draggableId]);
        localStorage.setItem("data", JSON.stringify(dataInLocal));
      }
    } else {
      localStorage.removeItem(`${draggableId}`, JSON.stringify(dataInLocal));
    }

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      const newColumnOrder = Array.from(columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      setColumnOrder(newColumnOrder);
      return;
    }

    const home = columns[source.droppableId];
    const foreign = columns[destination.droppableId];

    if (home === foreign) {
      const newTaskIds = Array.from(home.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newHome = {
        ...home,
        taskIds: newTaskIds,
      };

      setColumns(newHome);

      // const newState = {
      //   ...this.state,
      //   columns: {
      //     ...this.state.columns,
      //     [newHome.id]: newHome,
      //   },
      // };
      return;
    }

    // moving from one list to another
    const homeTaskIds = Array.from(home.taskIds);
    homeTaskIds.splice(source.index, 1);
    const newHome = {
      ...home,
      taskIds: homeTaskIds,
    };

    const foreignTaskIds = Array.from(foreign.taskIds);
    foreignTaskIds.splice(destination.index, 0, draggableId);
    const newForeign = {
      ...foreign,
      taskIds: foreignTaskIds,
    };

    const totalColumns = { [newHome.id]: newHome, [newForeign.id]: newForeign };
    setColumns(totalColumns);
  };
  console.log("columnOrder", columnOrder);
  return (
    <>
      {modifiedData}
      <Header text="TWITTER SAVER" />
      <Search search={search} />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="column"
        >
          {(provided) => (
            <Container {...provided.droppableProps} ref={provided.innerRef}>
              {columnOrder.map((columnId, index) => {
                const column = columns[columnId];
                return (
                  <InnerList
                    key={column.id}
                    column={column}
                    taskMap={initialData?.tasks}
                    index={index}
                  />
                );
              })}
              {provided.placeholder}
            </Container>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
