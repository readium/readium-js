// Description: This model is responsible for implementing the Alternate Style Tags specification
// found at http://idpf.org/epub/altss-tags/. The model selects a "preferred" style sheet or style set 
// with which to render an ePUB document. 
// 
// Notes: The convention in this model is to prepend the names of "private" methods with an underscore ('_')
//
// TODO: More validation for style sets with mixed rel="alternate ..." and rel="stylesheet"?
// TODO: Ensure that the "default" style set (the default in the ePub) is activated if no tags are supplied
define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var AlternateStyleTagSelector = Backbone.Model.extend({

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        initialize: function () {
        },

        /* Description: Activate a style set based on a single, or set, of ePub alternate style tags
         * Arguments (
         *   altStyleTags: An array of ePUB alternate style tags
         *   bookDom: An epub document object
         * )
         */
        activateAlternateStyleSet: function (altStyleTags, bookDom) {

            var $bookStyleSheets;
            var styleSetTitles = [];
            var that = this;
            var styleSetToActivate;

            // If there are no alternate tags supplied, do not change the style sets
            if (altStyleTags.length === 0) {

                return bookDom;
            }

            // Get all style sheets in the book dom
            $bookStyleSheets = $("link[rel*='stylesheet']", bookDom);

            // If the book does not have any stylesheets, do not change style sets
            if ($bookStyleSheets.length === 0) {

                return bookDom;
            }

            // Maintain original information about stylesheets
            $bookStyleSheets = this._storeOriginalAttributes($bookStyleSheets);

            // Get a list of the unique style set titles
            styleSetTitles = this._getStyleSetTitles($bookStyleSheets);

            // Determine which style set should be activated
            styleSetToActivate = this._getStyleSetTitleToActivate($bookStyleSheets, styleSetTitles, altStyleTags);

            // If no style was found to activate, based on the supplied tags, do not change the style sets
            if (styleSetToActivate === null) {

                return bookDom;
            }

            // Activate the specified style set, de-activing all others
            this._activateStyleSet($bookStyleSheets, styleSetToActivate);

            return bookDom;
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //

        /* Description: Activate the specified style set and de-activate all others
         * Design rationale: The disabled property is used to activate/de-activate the style sheets, as opposed to changing
         * attribute values, as this ensures that the document is re-rendered
         * Arguments (
         *   bookStyleSheets: A JQuery object of the ePubs style sheets
         *   styleSetToActivate: The attribute value for the "title" property of the style set to activate
         * )
         */
        _activateStyleSet: function (bookStyleSheets, styleSetToActivate) {

            bookStyleSheets.each(function () {

                $styleSheet = $(this);

                // The stylesheets must all be set as preferred so that when enabled, they will be activated
                $styleSheet.attr("rel", "stylesheet");
                // Always leave persistent style sets activated
                if ($styleSheet.attr('title') === undefined) {

                    $styleSheet[0].disabled = false;
                }
                // Activate this style set
                else if ($.trim($styleSheet.attr('title')) === styleSetToActivate) {

                    // Chrome is buggy and change to disabled = false is only
                    // picked up if you first set it to true
                    $styleSheet[0].disabled = true;
                    $styleSheet[0].disabled = false;
                }
                // De-activate other style sets
                else {

                    $styleSheet[0].disabled = true;
                }
            });

            return bookStyleSheets;
        },

        /* Description: Creates data attributes to store the original stylesheet attribute values
         * Design rationale: The "rel" attribute must be modified in other methods but we need to "remember"
         * the author's original style sheet specification
         * Arguments (
         *   bookStyleSheets: A JQuery object of the ePubs style sheets
         * )
         */
        _storeOriginalAttributes: function (bookStyleSheets) {

            var $styleSheet;

            // For each style sheet, if the original value attributes are empty, set them
            bookStyleSheets.each(function () {

                $styleSheet = $(this);

                if ($styleSheet.data('orig-rel') === undefined) {

                    $styleSheet.attr('data-orig-rel', $styleSheet.attr("rel"));
                }
            });

            return bookStyleSheets;
        },

        /* Description: Finds the title of the style set to activate using HTML preference rules for style sheets, as well as ePub
         * alternate style tags.
         * Arguments (
         *   bookStyleSheets: A JQuery object of the ePubs style sheets
         *   styleSetTitles: An array of the unique style set titles for the ePub
         *   altStyleTags: An array of ePUB alternate style tags
         * )
         * Error handling: Returns null if not title is found
         */
        _getStyleSetTitleToActivate: function (bookStyleSheets, styleSetTitles, altStyleTags) {

            var styleSetTagMatches = [];
            var styleSetNum;
            var $styleSet;
            var maxNumTagMatches;
            var styleSetCandidates = [];

            // Find the style set with the most matching alternate tags, removing mututally exclusive tags
            for (styleSetNum = 0; styleSetNum < styleSetTitles.length; styleSetNum += 1) {

                $styleSet = bookStyleSheets.filter("link[title='" + styleSetTitles[styleSetNum] + "']");
                $styleSet = this._removeMutuallyExclusiveAltTags($styleSet);
                styleSetTagMatches.push({ "numAltTagMatches": this._getNumAltStyleTagMatches($styleSet, altStyleTags),
                    "styleSetTitle": styleSetTitles[styleSetNum] });
            }

            // Get a list of the style sets with the maximum number of tag matches
            // _.max returns one of the info elements with a maximum value, which is why the numAltTagMatches property is used to retrieve the actual max value
            maxNumTagMatches = (_.max(styleSetTagMatches, function (styleSetTagMatchInfo) {
                return styleSetTagMatchInfo.numAltTagMatches
            })).numAltTagMatches;

            // Do nothing if there are no matching tags
            if (maxNumTagMatches === 0) {

                return null;
            }

            // Get a list of the style sets that had the maximum number of alternate tag matches
            _.each(styleSetTagMatches, function (styleSetTagMatchInfo) {

                if (styleSetTagMatchInfo['numAltTagMatches'] === maxNumTagMatches) {

                    styleSetCandidates.push(styleSetTagMatchInfo["styleSetTitle"]);
                }
            });

            // If there is only one style set in the candidate list
            if (styleSetCandidates === 1) {

                return styleSetCandidates[0];
            }
            // Since there are multiple candidates, return the style set that is preferred (the first style set with rel="stylesheet")
            else {

                var candidateNum;
                for (candidateNum = 0; candidateNum < styleSetCandidates.length; candidateNum++) {

                    // TODO: This assumes that all the style sheets in the style set are marked as either preferred or alternate. It simply checks the first
                    // style sheet of every style set.
                    $styleSet = bookStyleSheets.filter("link[title='" + styleSetCandidates[candidateNum] + "']");
                    if ($.trim($($styleSet[0]).attr("data-orig-rel")) === "stylesheet") {

                        return styleSetCandidates[candidateNum];
                    }
                }

                // If none of the stylesheets were preferred (only rel="alternate stylesheet"), return the first style set title
                return styleSetCandidates[0];
            }
        },

        /* Description: Finds the unique list of style set titles from the set of style sheets for the ePub
         * Arguments (
         *   bookStyleSheets: A JQuery object of the ePub's style sheets
         * )
         */
        _getStyleSetTitles: function (bookStyleSheets) {

            var styleSetTitles = [];

            // Find the unique style sets from the 'title' property
            bookStyleSheets.each(function () {

                var styleSheetTitle = $(this).attr("title");
                if (!_.include(styleSetTitles, styleSheetTitle)) {

                    styleSetTitles.push(styleSheetTitle);
                }
            });

            return styleSetTitles;
        },

        /* Description: Finds the number of alternate style tags in a style set's class attribute
         * Arguments (
         *   styleSet: A JQuery object that represents a single style set
         *   altStyleTags: An array of ePUB alternate style tags
         * )
         */
        _getNumAltStyleTagMatches: function (styleSet, altStyleTags) {

            var numMatches = 0;

            // If the alt style tag is found in the style set, increment num matches
            var altTagNum;
            for (altTagNum = 0; altTagNum < altStyleTags.length; altTagNum += 1) {

                // filter used so top-level elements are selected
                if (styleSet.filter("link[class*='" + altStyleTags[altTagNum] + "']").length > 0) {

                    numMatches++;
                }
            }

            return numMatches;
        },

        //
        /* Description: This method removes, thus ignoring, mututally exclusive alternate tags within a style set
         * Arguments (
         *   styleSet: A JQuery object that represents a single style set
         * )
         */
        //TODO: Maybe change this to act on data- attributes, rather than the actual class attribute
        _removeMutuallyExclusiveAltTags: function (styleSet) {

            var $styleSheet;

            if (styleSet.filter("link[class*='night']").length > 0 &&
                styleSet.filter("link[class*='day']").length > 0) {

                styleSet.each(function () {

                    $styleSheet = $(this);

                    if ($styleSheet.filter('.night').length > 0) {

                        $styleSheet.toggleClass('night');
                    }

                    if ($styleSheet.filter('.day').length > 0) {

                        $styleSheet.toggleClass('day');
                    }
                });
            }

            if (styleSet.filter("link[class*='vertical']").length > 0 &&
                styleSet.filter("link[class*='horizontal']").length > 0) {

                styleSet.each(function () {

                    $styleSheet = $(this);

                    if ($styleSheet.filter('.vertical').length > 0) {

                        $styleSheet.toggleClass('vertical');
                    }

                    if ($styleSheet.filter('.horizontal').length > 0) {

                        $styleSheet.toggleClass('horizontal');
                    }
                });
            }

            return styleSet;
        }
    });
    return AlternateStyleTagSelector;
});