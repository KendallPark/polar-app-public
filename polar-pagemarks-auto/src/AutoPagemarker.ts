/**
 * Takes a set of computed visibilities, then determines where to place the pagemarks.
 */
import {AutoPagemarkCalculator, PageVisibility, ViewVisibility} from "./AutoPagemarkCalculator";
import {UnixTimeMS} from "polar-shared/src/metadata/ISODateTimeStrings";

const MIN_DURATION = 30 * 1000;

/**
 * A page ID greater than 1.
 */
export type PageID = number;

export interface Position {
    readonly pageVisibility: PageVisibility;
    readonly timestamp: UnixTimeMS;
}

/**
 * The strategy used within the compute (for testing primarily)
 *
 * init: there was no previous position so we just initialized it.
 *
 * early: we haven't been on a spot long enough for it to be considered 'reading'
 *        and so we skipped this update.
 *
 * jumped: We jumped around the page and didn't scroll forward on a page.
 *
 * created: a new pagemark was created and emitted.
 *
 * no-pages: no pages were visible.  I practice this should never happen though.
 */
export type ComputeStrategy = 'init' | 'early' | 'jumped' | 'created' | 'no-pages';

export interface ComputeResult {
    readonly strategy: ComputeStrategy;
}


export type CreatePagemarkCallback = (page: PageID) => void;

export class AutoPagemarker {

    private position?: Position;

    constructor(private callback: CreatePagemarkCallback) {
    }

    public compute(curr: ViewVisibility): ComputeResult {

        const visible = AutoPagemarkCalculator.visible(curr.visibilities);
        
        if (visible.length === 0) {
            console.warn("Nothing visible");
            return {strategy: 'no-pages'};
        }

        const pageVisibility = visible[0];

        const updatePosition = () => {

            this.position = {
                pageVisibility,
                timestamp: Date.now()
            };

        };

        if (this.position === undefined) {
            
            // if the current position is undefined, then we've just started
            // and so there's nothing left to do

            updatePosition();
            return {strategy: 'init'};
            
        }

        if ((Date.now() - this.position.timestamp) < MIN_DURATION) {
            updatePosition();
            return {strategy: 'early'};
        }


        const prevPageID = (pageVisibility.id - 1);

        if (this.position.pageVisibility.id === prevPageID) {
            // we have advanced one page exactly and the previous page
            // is now moved forward.
            this.callback(prevPageID);
            return {strategy: 'created'};

        } else {
            updatePosition();
            return {strategy: 'jumped'};
        }

    }

}
