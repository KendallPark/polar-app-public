import * as chai from 'chai';
import {assert} from 'chai';

chai.config.truncateThreshold = 0;

export function assertJSON(actual: any,
                           expected: any,
                           message?: string,
                           unsorted?: boolean) {

    // first convert both to JSON if necessary.
    actual = toJSON(actual, unsorted);
    expected = toJSON(expected, unsorted);

    if ( actual !== expected) {
        console.error("BEGIN ACTUAL ==========");
        console.error(actual);
        console.error("END ACTUAL   ==========");
    }

    try {

        assert.equal(expected, actual, message);

    } catch (e) {
        console.error(e.message);
        throw e;
    }

}

/**
 * Testing function to compare two objects for equality.
 */
export function equalsJSON(actual: any,
                           expected: any,
                           message?: string,
                           unsorted?: boolean): boolean {

    // first convert both to JSON if necessary.
    actual = toJSON(actual, unsorted);
    expected = toJSON(expected, unsorted);

    if ( actual !== expected) {
        console.error("BEGIN ACTUAL ==========");
        console.error(actual);
        console.error("END ACTUAL   ==========");
        return false;
    }

    return true;

}


export function toJSON(obj: any, unsorted: boolean = false): string {

    if (typeof obj === "string") {
        // first parse it as as JSON into an object so it's serialized using
        // the same canonical function below.
        obj = JSON.parse(obj);
    }

    // if(obj instanceof Array) {
    //     if( obj.length >= 1 ) {
    //         if ((typeof obj[0]) === "string") {
    //             return obj;
    //         }
    //     }
    // }

    // also accept an array of strings.

    const replacer = (key: any, value: any) => {

        // handle set replacement...
        if (typeof value === 'object' && value instanceof Set) {
            return [...value];
        }

        return value;

    };

    if (! Array.isArray(obj) && !unsorted) {

        // TODO: because of the toJSON method we might want to call JSON
        // stringify, then parse it again, then sort, then stringify again.

        obj = sorted(obj);
    }

    return JSON.stringify(obj, replacer, "  ");

}

function sorted(dict: any): any {

    if (dict === undefined || dict === null) {
        // nothing to do here.
        return dict;
    }

    if (! (typeof dict === 'object')) {
        // if we're not a dictionary we're done
        return dict;
    }


    if (Array.isArray(dict)) {

        const result: any[] = [];

        for (let idx = 0; idx < dict.length; ++idx) {
            result[idx] = sorted(dict[idx]);
        }

        return result;

    } else {

        const result: any = {};

        Object.keys(dict).sort().forEach(key => {
            result[key] = sorted(dict[key]);
        });

        return result;

    }

}