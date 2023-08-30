import "./App.css";
import { useDispatch, useSelector } from "react-redux";
import { Post } from "./interface";
import { decrease, increase, redo, undo } from "./reducer";

const PostView = () => {
  const vote = useSelector((state) => state) as Post;
  const dispatch = useDispatch();
  return (
    <>
      <div>{vote.counter}</div>
      <button
        onClick={() => {
          dispatch(increase(null));
        }}
      >
        Increase
      </button>
      <button
        onClick={() => {
          dispatch(decrease(null));
        }}
      >
        Decrease
      </button>
      <button
        onClick={() => {
          dispatch(undo());
        }}
      >
        Undo
      </button>
      <button
        onClick={() => {
          dispatch(redo());
        }}
      >
        Redo
      </button>
    </>
  );
};

function App() {
  return (
    <>
      <PostView></PostView>
    </>
  );
}

export default App;
