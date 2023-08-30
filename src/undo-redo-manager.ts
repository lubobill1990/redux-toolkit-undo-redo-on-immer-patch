import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";

export class UndoRedoManager<T> {
  private current: number = 0;
  private buffer: T[] = [];
  private position$;

  constructor(private maxSize = 100) {
    this.position$ = new BehaviorSubject({
      bufferLength: this.buffer.length,
      current: this.current,
    });
  }

  private cleanupOnMaxSize() {
    if (this.current <= this.maxSize) {
      return;
    }
    const trimStart = this.current - this.maxSize;
    this.buffer = this.buffer.slice(trimStart);
    this.current -= trimStart;
  }

  private cleanupFuture() {
    if (this.buffer.length > this.current) {
      // remove all the patches after the current position
      this.buffer.splice(this.current, this.buffer.length - this.current);
    }
  }

  private updateSubjects() {
    this.position$.next({
      bufferLength: this.buffer.length,
      current: this.current,
    });
  }

  get canUndo$() {
    return this.position$
      .pipe(
        map(({ bufferLength, current }) => {
          return bufferLength > 0 && current > 0;
        })
      )
      .pipe(distinctUntilChanged());
  }

  get canUndo() {
    return this.buffer.length > 0 && this.current > 0;
  }

  get canRedo$() {
    return this.position$
      .pipe(map(({ bufferLength, current }) => bufferLength > current))
      .pipe(distinctUntilChanged());
  }

  get canRedo() {
    return this.buffer.length > this.current;
  }

  get bufferLength() {
    return this.buffer.length;
  }

  get currentPosition() {
    return this.current;
  }

  public add(patch: T) {
    this.buffer[this.current] = patch;
    this.current += 1;
    this.cleanupFuture();
    this.cleanupOnMaxSize();
    this.updateSubjects();
  }

  public undo() {
    if (this.current > 0) {
      const history = this.buffer[this.current - 1];
      this.current -= 1;
      this.updateSubjects();
      return history;
    }
    return null;
  }

  public redo() {
    if (this.current < this.buffer.length) {
      const future = this.buffer[this.current];
      this.current += 1;
      this.updateSubjects();
      return future;
    }
    return null;
  }

  public modifyAroundCurrent(
    historyModifier: (patch: T) => T | null | undefined,
    futureModifier: (patch: T) => T | null | undefined
  ) {
    this.modifyFirstHistory(historyModifier);
    this.modifyFirstFuture(futureModifier);
    this.updateSubjects();
  }

  private modifyFirstHistory(
    historyModifier: (patch: T) => T | null | undefined
  ) {
    let indexToModify = -1;
    let modifiedHistory: T | null | undefined = undefined;
    for (let i = this.current - 1; i >= 0; i--) {
      const patch = this.buffer[i];
      modifiedHistory = historyModifier(patch);
      if (modifiedHistory !== undefined) {
        indexToModify = i;
        break;
      }
    }
    this.modifyOnPosition(indexToModify, modifiedHistory);
  }

  private modifyFirstFuture(
    futureModifier: (patch: T) => T | null | undefined
  ) {
    let indexToModify = -1;
    let modifiedFuture: T | null | undefined = undefined;
    for (let i = this.current; i < this.buffer.length; i++) {
      modifiedFuture = futureModifier(this.buffer[i]);
      if (modifiedFuture !== undefined) {
        indexToModify = i;
        break;
      }
    }
    this.modifyOnPosition(indexToModify, modifiedFuture);
  }

  private modifyOnPosition(indexToModify: number, patch: T | null | undefined) {
    if (indexToModify !== -1 && patch !== undefined) {
      if (patch === null) {
        this.buffer = this.buffer
          .slice(0, indexToModify)
          .concat(this.buffer.slice(indexToModify + 1));
        if (this.current > indexToModify) {
          this.current -= 1;
        }
      } else {
        this.buffer[indexToModify] = patch;
      }
    }
  }
}
