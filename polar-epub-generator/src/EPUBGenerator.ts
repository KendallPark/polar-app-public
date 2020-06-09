import JSZip from "jszip";
import {arrayStream} from "polar-shared/src/util/ArrayStreams";
import {TemplateLiterals} from "./TemplateLiterals";
import {Templates} from "./Templates";
import {
    ISODateString,
    ISODateTimeString
} from "polar-shared/src/metadata/ISODateTimeStrings";
import {IDStr} from "polar-shared/src/util/Strings";
import {URLPathStr} from "polar-shared/src/url/PathToRegexps";

export namespace EPUBGenerator {

    import ISpineItem = TemplateLiterals.ISpineItem;
    export type AuthorStr = string;

    export type URLStr = string;

    /**
     * ISO 2 char language code (defaults to en)
     */
    export type LangStr = string;

    export type RawData = string | Uint8Array | ArrayBuffer | Blob;

    export type ImageData = RawData;

    export type HTMLData = RawData;

    export type MediaType = 'text/html' | 'application/xhtml+xml' | 'image/png' | 'image/jpeg';

    interface EPUBImage {
        readonly path: string;
        readonly data: ImageData;
    }

    export interface EPUBDocument {

        /**
         * URL representing this document.
         */
        readonly url: string;

        readonly title: string;

        readonly contents: ReadonlyArray<EPUBContent>;

        readonly creator?: string;

        readonly authors?: ReadonlyArray<AuthorStr>;

        readonly cover?: RawData;

        readonly lang?: LangStr;

        readonly tocTitle?: string;

        /**
         * The time the document was published.
         */
        readonly publication?: ISODateTimeString | ISODateString;

        readonly conversion: ISODateTimeString | ISODateString;

    }

    export interface EPUBContent {

        readonly id: IDStr;

        readonly href: URLPathStr;

        readonly mediaType: MediaType;

        readonly title: string;

        readonly authors?: ReadonlyArray<AuthorStr>;

        readonly data: HTMLData;

        /**
         * The images associated with this chapter.
         */
        readonly images: ReadonlyArray<EPUBImage>;

        // excludeFromToc: optional, if is not shown on Table of content, default: false;
        // beforeToc: optional, if is shown before Table of content, such like copyright pages. default: false;
        // filename: optional, specify filename for each chapter, default: undefined;

    }

    interface EPUBContentWithPath extends EPUBContent {
        readonly path: string;
    }

    export function renderContainerXML(): string {
        return TemplateLiterals.CONTAINER;
    }

    export function renderContentOPF(doc: EPUBDocument) {

        function toSpine(): ReadonlyArray<TemplateLiterals.ISpineItem> {

            function toSpineItem(content: EPUBContent): TemplateLiterals.ISpineItem {

                return {
                    idref: content.id,
                    linear: 'yes'
                };

            }

            return doc.contents.map(toSpineItem);

        }

        function toManifest(): ReadonlyArray<TemplateLiterals.IManifestItem> {

            function toManifestItem(content: EPUBContent): TemplateLiterals.IManifestItem {

                return {
                    id: content.id,
                    href: content.href,
                    mediaType: content.mediaType
                };

            }

            return doc.contents.map(toManifestItem);

        }


        const spine = toSpine();
        const manifest = toManifest();

        const content: TemplateLiterals.IContent = {
            id: doc.url,
            title: doc.title,
            source: doc.url,

            creator: doc.creator,
            lang: doc.lang || 'en',

            // we don't need this now as there aren't many subjects there.
            subjects: [],
            publication: doc.publication,
            conversion: doc.conversion,

            spine,
            manifest,

            // we don't need a guid now as a cover and ToC are sort of redundant
            // and unnecessary in HTML captures.
            guide: []

        }

        return Templates.render(TemplateLiterals.CONTENT_OPF, content);

    }

    export function renderTOCNCX(doc: EPUBDocument) {

        function toPages(): ReadonlyArray<TemplateLiterals.IPage> {

            function toPage(content: EPUBContent, idx: number): TemplateLiterals.IPage {

                return {
                    playOrder: idx,
                    label: content.title,
                    src: content.href
                };

            }
            return doc.contents.map(toPage);

        }

        const pages = toPages();

        const content: TemplateLiterals.ITOC = {
            uid: doc.url,
            title: doc.title,
            totalPageCount: doc.contents.length,
            maxPageNumber: doc.contents.length,
            pages
        }

        return Templates.render(TemplateLiterals.TOC_NCX, content);

    }

    /**
     *
     * Generate an EPUB and build the data into a zip buffer.
     *
     * @return ArrayBuffer Return an ArrayBuffer as we can convert this to either
     * a Blob for use in the browser or a Buffer for use in Node.
     */
    export async function generate(doc: EPUBDocument): Promise<ArrayBuffer> {

        /*
         Files I have to generate

         /mimetype

            which is just `application/epub+zip` without \n at the end

         /META-INF/container.xml

            Templates.CONTAINER

        /OEBPS/content.opf
        /OEBPS/toc.ncs

        */

        const zip = new JSZip();

        function writeControlFiles() {
            zip.file('mimetype', 'application/epub+zip');
            zip.file('META-INF/container.xml', renderContainerXML());
            zip.file('OEBPS/content.opf', renderContentOPF(doc));
            zip.file('OEBPS/toc.ncx', renderTOCNCX(doc));
        }

        function writeContents() {
            const contents = withPath(doc.contents);

            for (const content of contents) {

                zip.file('OEBPS/'+ content.path, content.data);

                for (const image of content.images) {
                    zip.file('OEBPS/' + image.path, image.data);
                }

            }
        }

        async function toArrayBuffer() {

            const options: JSZip.JSZipGeneratorOptions<'arraybuffer'> = {
                type: 'arraybuffer',
                streamFiles: true,
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            };

            return <ArrayBuffer> await zip.generateAsync(options);

        }

        writeControlFiles();
        writeContents();

        return await toArrayBuffer();

    }

    function withPath(contents: ReadonlyArray<EPUBContent>): ReadonlyArray<EPUBContentWithPath> {

        return arrayStream(contents)
            .withIndex()
            .map((current, idx) => {
                return {
                    path: `chap-${idx}.html`,
                    ...current.value
                }
            })
            .collect();

    }



}


