import {arrayStream} from "./ArrayStreams";
import {assertJSON} from "polar-test/src/test/Assertions";

describe('ArrayStreams', function() {

    it("flatMap", function() {

        assertJSON(arrayStream([[1],[2]])
                        .flatMap(current => current)
                        .collect(),
                   [1, 2]);

        assertJSON(arrayStream([[1, 2],[3]])
                .flatMap(current => current)
                .collect(),
            [1, 2, 3]);

    });

    it("flatMap typed", function() {

        interface Animal {
            name: string;
        }

        const animals: ReadonlyArray<ReadonlyArray<Animal>> = [
            [
                {name: 'cat'},
                {name: 'dog'}
            ],
            [
                {name: 'mouse'}
            ]
        ];

        const flatMapped: ReadonlyArray<Animal>
            = arrayStream(animals)
                .flatMap(current => current)
                .collect();

        assertJSON(flatMapped,
            [
                {
                    "name": "cat"
                },
                {
                    "name": "dog"
                },
                {
                    "name": "mouse"
                }
            ]);

    });

});
