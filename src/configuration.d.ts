export namespace InsertLineNumberConfig {
    /**
     * Type of the 'start' value.
     *   - "current": Starts from the real current line number.
     *                For example, user selects line 10-15 in the editor,
     *                line numbers 10-15 will be inserted to these lines.
     *   -    number: Starts from the given number.
     *                For example, when the 'start' is set to 1, and
     *                user selects line 10-15 in the editor,
     *                line number 1-6 will be inserted to these lines.
     */
    export type StartNumberType = "current" | number;

    /**
     * Type of the 'align' value.
     *   -  "left": Align to left.
     *   - "right": Align to right.
     * Note,
     *   The alignment only apply to the formatted number, no matter the perfix and suffix.
     *   For example, when prefix is 'C_' and suffix is ':', the result may be 'C_1  :' or 'C_12 :'.
     */
    export type AlignType = "left" | "right";

    /**
     * Type of the 'padding' value.
     *   - "space": Pad line numbers with whitespaces.
     *   -  "zero": Pad line numbers with 0.
     */
    export type PaddingCharType = "space" | "zero";

    /**
     * Type of the 'width' value.
     *   -      "normal": No padding, keep the line numbers as-is.
     *   - "alignToLast": Pad the line numbers to the last (longest) one.
     *   -        number: Pad the line numbers to the given width.
     */
    export type NumberWidthType = "normal" | "alignToLast" | number;

    /**
     * Schema of each element in 'InsertLineNumber.formats' array in settings file.
     */
    export interface Format {
        /**
         * Line number of the first line.
         * Default: 1
         */
        start?: StartNumberType;

        /**
         * Alignment of the line number.
         * Default: "left"
         */
        align?: AlignType;

        /**
         * Padding char to satisfy padding to the width.
         * Default: "space"
         */
        padding?: PaddingCharType;

        /**
         * Width of each line number.
         * Default: "normal"
         * 
         * Note, if a line number were longer than the specified width,
         *       it won't be truncated.
         */
        width?: NumberWidthType;

        /**
         * Perfix would be inserted before the formatted line number.
         * Default: ""
         */
        prefix?: string;

        /**
         * Suffix would be inserted after the formatted line number.
         * Default: ":  "
         */
        suffix?: string;
    }
}

export namespace ShowAllOpenedFilesConfig {
    export interface Config {
        itemWidth:number;
    }
}