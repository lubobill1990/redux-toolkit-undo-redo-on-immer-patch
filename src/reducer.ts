/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Action,
  AnyAction,
  CaseReducer,
  createSlice,
  original,
} from "@reduxjs/toolkit";
import { Post } from "./interface";
import { Draft, Patch, applyPatches, enablePatches, produce } from "immer";
import { Subject } from "rxjs";

import { UndoRedoManager } from "./undo-redo-manager";
enablePatches();

type UndoRedoPatch = {
  patches: Patch[];
  inversePatches: Patch[];
};
const undoRedoPatchSubject = new Subject<UndoRedoPatch>();

const undoRedoManager = new UndoRedoManager<UndoRedoPatch>();
undoRedoPatchSubject.asObservable().subscribe((patch) => {
  undoRedoManager.add(patch);
});

function enableUndoRedo<S, A extends Action = AnyAction>(
  reducer: CaseReducer<S, A>
) {
  return (state: Draft<S>, action: A) => {
    if ((action as any).undoable === false) {
      return reducer(state, action);
    }

    return produce(
      original(state),
      (draft: Draft<S>) => {
        reducer(draft, action);
      },
      (patches, inversePatches) => {
        undoRedoPatchSubject.next({ patches, inversePatches });
      }
    );
  };
}

const initialState: Post = {
  counter: 0,
  color: "red",
  name: "John",
  id: 0,
  title: "Hello World",
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    changeName: (state, action) => {
      state.name = action.payload;
    },
    changeColor: (state, action) => {
      state.color = action.payload;
    },
    increase: enableUndoRedo((state) => {
      state.counter += 1;
    }),
    decrease: enableUndoRedo((state) => {
      state.counter -= 1;
    }),
    undo: (state) => {
      const patches = undoRedoManager.undo()?.inversePatches ?? [];
      if (patches.length === 0) {
        return;
      }
      return applyPatches(state, patches);
    },
    redo: (state) => {
      const patches = undoRedoManager.redo()?.patches ?? [];
      if (patches.length === 0) {
        return;
      }
      return applyPatches(state, patches);
    },
  },
});

// `createSlice` automatically generated action creators with these names.
// export them as named exports from this "slice" file
export const { changeName, changeColor, increase, decrease, undo, redo } =
  editorSlice.actions;

// Export the slice reducer as the default export
export default editorSlice.reducer;
