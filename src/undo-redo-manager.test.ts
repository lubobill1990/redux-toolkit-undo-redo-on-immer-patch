import { UndoRedoManager } from "./undo-redo-manager";
import { describe, test, expect, beforeEach } from "vitest";
describe("undo-redo-manager", () => {
  let undoRedoManager = new UndoRedoManager<number>();
  beforeEach(() => {
    undoRedoManager = new UndoRedoManager<number>();
  });
  test("should add, can undo after adding", () => {
    expect.assertions(3);
    let canUndo = false;
    const canRedo = false;
    undoRedoManager.canRedo$.subscribe((v) => {
      expect(v).toBe(canRedo);
    });
    undoRedoManager.canUndo$.subscribe((v) => {
      expect(v).toBe(canUndo);
    });
    canUndo = true;
    undoRedoManager.add(1);
    undoRedoManager.add(2);
  });

  test("should undo, can redo after undo, can't redo after redo", () => {
    expect.assertions(3);
    let canRedo = false;
    undoRedoManager.canRedo$.subscribe((v) => {
      expect(v).toBe(canRedo);
    });
    undoRedoManager.add(1);
    undoRedoManager.add(2);
    canRedo = true;
    undoRedoManager.undo();
    canRedo = false;
    undoRedoManager.redo();
    undoRedoManager.redo();
  });
  test("Should be able to undo multiple times", () => {
    expect.assertions(4);
    let canUndo = false;
    undoRedoManager.canUndo$.subscribe((v) => {
      expect(v).toBe(canUndo);
    });
    canUndo = true;
    undoRedoManager.add(1);
    canUndo = false;
    undoRedoManager.undo();
    undoRedoManager.undo();
    undoRedoManager.undo();
    undoRedoManager.undo();
    canUndo = true;
    undoRedoManager.redo();
    undoRedoManager.redo();
    undoRedoManager.redo();
    undoRedoManager.redo();
  });
  test("Should be able to redo multiple times", () => {
    expect.assertions(3);
    let canRedo = false;
    undoRedoManager.canRedo$.subscribe((v) => {
      expect(v).toBe(canRedo);
    });
    undoRedoManager.add(1);
    undoRedoManager.add(2);
    canRedo = true;
    undoRedoManager.undo();
    undoRedoManager.undo();
    undoRedoManager.undo();
    undoRedoManager.undo();
    undoRedoManager.redo();
    canRedo = false;
    undoRedoManager.redo();
    undoRedoManager.redo();
    undoRedoManager.redo();
    undoRedoManager.redo();
  });
  test("Undo redo should return correct value", () => {
    undoRedoManager.add(1);
    undoRedoManager.add(2);
    undoRedoManager.add(3);
    expect(undoRedoManager.redo()).toBeNull();
    expect(undoRedoManager.undo()).toBe(3);
    expect(undoRedoManager.redo()).toBe(3);
    expect(undoRedoManager.undo()).toBe(3);
    expect(undoRedoManager.undo()).toBe(2);
    expect(undoRedoManager.undo()).toBe(1);
    expect(undoRedoManager.undo()).toBeNull();
    expect(undoRedoManager.undo()).toBeNull();
    expect(undoRedoManager.redo()).toBe(1);
    expect(undoRedoManager.redo()).toBe(2);
    expect(undoRedoManager.redo()).toBe(3);
  });
  test("Should respect max size", () => {
    const undoRedoManager = new UndoRedoManager<number>(2);
    undoRedoManager.add(1);
    undoRedoManager.add(2);
    undoRedoManager.add(3);
    expect(undoRedoManager.undo()).toBe(3);
    expect(undoRedoManager.undo()).toBe(2);
    expect(undoRedoManager.undo()).toBeNull();
    expect(undoRedoManager.redo()).toBe(2);
    expect(undoRedoManager.redo()).toBe(3);
    expect(undoRedoManager.redo()).toBeNull();
  });

  test("Should cleanup future on add", () => {
    undoRedoManager.add(1);
    undoRedoManager.add(2);
    undoRedoManager.add(3);
    expect(undoRedoManager.bufferLength).toBe(3);
    expect(undoRedoManager.currentPosition).toBe(3);
    undoRedoManager.undo();
    expect(undoRedoManager.bufferLength).toBe(3);
    expect(undoRedoManager.currentPosition).toBe(2);
    undoRedoManager.undo();
    expect(undoRedoManager.bufferLength).toBe(3);
    expect(undoRedoManager.currentPosition).toBe(1);
    undoRedoManager.add(4);
    expect(undoRedoManager.bufferLength).toBe(2);
    expect(undoRedoManager.currentPosition).toBe(2);
    expect(undoRedoManager.redo()).toBeNull();
    expect(undoRedoManager.currentPosition).toBe(2);
    expect(undoRedoManager.undo()).toBe(4);
    expect(undoRedoManager.undo()).toBe(1);
    expect(undoRedoManager.undo()).toBeNull();
  });

  test("ModifyAround should work", () => {
    undoRedoManager.add(1);
    undoRedoManager.add(2);
    undoRedoManager.add(3);
    undoRedoManager.add(4);
    undoRedoManager.add(5);
    undoRedoManager.add(6);
    expect(undoRedoManager.bufferLength).toBe(6);
    expect(undoRedoManager.currentPosition).toBe(6);

    undoRedoManager.modifyAroundCurrent(
      (patch) => {
        if (patch === 4) {
          return 7;
        }
      },
      (patch) => {
        return patch + 1;
      }
    );
    expect(undoRedoManager.bufferLength).toBe(6);
    expect(undoRedoManager.currentPosition).toBe(6);
    expect(undoRedoManager.undo()).toBe(6);
    expect(undoRedoManager.undo()).toBe(5);
    expect(undoRedoManager.undo()).toBe(7);

    expect(undoRedoManager.bufferLength).toBe(6);
    expect(undoRedoManager.currentPosition).toBe(3);
    undoRedoManager.modifyAroundCurrent(
      (patch) => {
        if (patch === 2) {
          return null;
        }
      },
      (patch) => {
        return patch + 1;
      }
    );

    expect(undoRedoManager.bufferLength).toBe(5);
    expect(undoRedoManager.currentPosition).toBe(2);
    expect(undoRedoManager.undo()).toBe(3);
    expect(undoRedoManager.undo()).toBe(1);
    expect(undoRedoManager.undo()).toBeNull();
    
    expect(undoRedoManager.redo()).toBe(1);
    expect(undoRedoManager.redo()).toBe(3);
    expect(undoRedoManager.redo()).toBe(8);
    expect(undoRedoManager.redo()).toBe(5);
    expect(undoRedoManager.redo()).toBe(6);
    expect(undoRedoManager.redo()).toBeNull();
  });
});
