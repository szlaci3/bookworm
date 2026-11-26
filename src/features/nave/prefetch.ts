import { createAction, type UnknownAction } from '@reduxjs/toolkit';
import type { Epic } from 'redux-observable';
import { concatMap, filter, from, ignoreElements, switchMap, timer } from 'rxjs';

export const nearbyBooksChanged = createAction<string[]>('nave/nearbyBooksChanged');

export function createPrefetchEpic(fetchDetails: (id: string) => PromiseLike<unknown>): Epic<UnknownAction, never> {
  return actions => {
    // Keep one speculative request in flight across navigation windows. If it
    // becomes the foreground request, RTK Query can still share its response.
    let active = Promise.resolve();
    return actions.pipe(
      filter(nearbyBooksChanged.match),
      switchMap(({ payload }) => timer(100).pipe(
        switchMap(() => from(payload)),
        concatMap(id => from(active).pipe(
          switchMap(() => {
            active = Promise.resolve(fetchDetails(id)).then(() => undefined, () => undefined);
            return active;
          }),
        )),
      )),
      ignoreElements(),
    );
  };
}
