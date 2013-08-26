//  Created by Boris Schneiderman.
//  Copyright (c) 2012-2013 The Readium Foundation.
//
//  The Readium SDK is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.


/**
 * This object is not instantiated directly but provided by the host application to the DOMAccess layer in the
 * ReadiumSDK.Views.ReaderView.openBook function
 *
 * Provided for reference only
 *
 *@class ReadiumSDK.Models.PackageData
 */

ReadiumSDK.Models.PackageData = {

    /**
     * @property rootUrl Url of the package file
     * @type {string}
     *
     */
    rootUrl: "",
    /**
     *
     * @property rendering_layout expected values "reflowable"|rendering_layout="pre-paginated"
     * @type {string}
     */
    rendering_layout: "",

    spine: {

        direction: "ltr",
        items: [
            {
                href:"",
                idref:"",
                page_spread:"", //"page-spread-left"|"page-spread-right"|"page-spread-center"
                rendering_layout:"" //"reflowable"|"pre-paginated"
            }
        ]
    }
};
