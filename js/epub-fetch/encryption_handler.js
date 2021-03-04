//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.

define(['cryptoJs/sha1'], function (CryptoJS_SHA1) {

    var EncryptionHandler = function (encryptionData) {
        var self = this;

        var ENCRYPTION_METHODS = {
            'http://www.idpf.org/2008/embedding': embeddedFontDeobfuscateIdpf,
            'http://ns.adobe.com/pdf/enc#RC': embeddedFontDeobfuscateAdobe
        };

        // INTERNAL FUNCTIONS

        function blob2BinArray(blob, callback) {
            var fileReader = new FileReader();
            fileReader.onload = function () {
                var arrayBuffer = this.result;
                callback(new Uint8Array(arrayBuffer));
            };
            fileReader.readAsArrayBuffer(blob);
        }

        function xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, xorKey, callback) {
            var obfuscatedPrefixBlob = obfuscatedResourceBlob.slice(0, prefixLength);
            blob2BinArray(obfuscatedPrefixBlob, function (bytes) {
                var masklen = xorKey.length;
                for (var i = 0; i < prefixLength; i++) {
                    bytes[i] = bytes[i] ^ (xorKey[i % masklen]);
                }
                var deobfuscatedPrefixBlob = new Blob([bytes], { type: obfuscatedResourceBlob.type });
                var remainderBlob = obfuscatedResourceBlob.slice(prefixLength);
                var deobfuscatedBlob = new Blob([deobfuscatedPrefixBlob, remainderBlob],
                    { type: obfuscatedResourceBlob.type });

                callback(deobfuscatedBlob);
            });
        }

        function embeddedFontDeobfuscateIdpf(obfuscatedResourceBlob, callback) {
            
            var prefixLength = 1040;
            // Shamelessly copied from
            // https://github.com/readium/readium-chrome-extension/blob/26d4b0cafd254cfa93bf7f6225887b83052642e0/scripts/models/path_resolver.js#L102 :

            xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, encryptionData.uidHash, callback);
        }

        function urnUuidToByteArray(id) {
            var uuidRegexp = /(urn:uuid:)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i;
            var matchResults = uuidRegexp.exec(id);
            var rawUuid = matchResults[2] + matchResults[3] + matchResults[4] + matchResults[5] + matchResults[6];
            if (!rawUuid || rawUuid.length != 32) {
                console.error('Bad UUID format for ID :' + id);
            }
            var byteArray = [];
            for (var i = 0; i < 16; i++) {
                var byteHex = rawUuid.substr(i * 2, 2);
                var byteNumber = parseInt(byteHex, 16);
                byteArray.push(byteNumber);
            }
            return byteArray;
        }

        function embeddedFontDeobfuscateAdobe(obfuscatedResourceBlob, callback) {
            
            // extract the UUID and convert to big-endian binary form (16 bytes):
            var uidWordArray = urnUuidToByteArray(encryptionData.uid);
            var prefixLength = 1024;

            xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, uidWordArray, callback)
        }


        // PUBLIC API

        this.isEncryptionSpecified = function () {
            return encryptionData && encryptionData.encryptions;
        };


        this.getEncryptionMethodForRelativePath = function (pathRelativeToRoot) {
            if (self.isEncryptionSpecified()) {
                return encryptionData.encryptions[pathRelativeToRoot];
            } else {
                return undefined;
            }
        };

        this.getDecryptionFunctionForRelativePath = function (pathRelativeToRoot) {
        
            var encryptionMethod = self.getEncryptionMethodForRelativePath(pathRelativeToRoot);
            
            //console.debug(pathRelativeToRoot + " -- " + encryptionMethod + " ... " + typeof ENCRYPTION_METHODS[encryptionMethod]);
            
            if (encryptionMethod && ENCRYPTION_METHODS[encryptionMethod]) {
                return ENCRYPTION_METHODS[encryptionMethod];
            } else {
                return undefined;
            }
        };

    };

    EncryptionHandler.CreateEncryptionData =  function(id, encryptionDom) {

        var txt = unescape(encodeURIComponent(id.trim()));
        var sha = CryptoJS_SHA1(txt);
        
        //console.debug(sha.toString(CryptoJS.enc.Hex));
        
        var byteArray = [];
        
        for (var i = 0; i < sha.sigBytes; i++) {
            byteArray.push((sha.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
        }
        
        // for (var i = 0; i < sha.words.length; ++i) {
        //     for (var j = 3; j >= 0; --j) {
        //         byteArray.push((sha.words[i] >> 8 * j) & 0xFF);
        //     }
        // }
        
        var encryptionData = {
            uid: id,
            uidHash: byteArray,
            encryptions: undefined
        };
        var encryptedDatas = encryptionDom.children[0].getElementsByTagNameNS("*", 'EncryptedData');
        Array.prototype.forEach.call(encryptedDatas, function (encryptedData) {
            var encryptionAlgorithm = $(encryptedData.getElementsByTagNameNS("*", 'EncryptionMethod')[0]).attr('Algorithm');
            var cipherReferences = encryptedData.getElementsByTagNameNS("*", 'CipherReference');
            Array.prototype.forEach.call(cipherReferences, function (cipherReference) {
                
                //var cipherReferenceURI = "/" + $(cipherReference).attr('URI');
                var cipherReferenceURI = $(cipherReference).attr('URI');
                
                console.log('Encryption/obfuscation algorithm ' + encryptionAlgorithm + ' specified for ' +
                    cipherReferenceURI);

                if(!encryptionData.encryptions) {
                    encryptionData.encryptions = {};
                }

                encryptionData.encryptions[cipherReferenceURI] = encryptionAlgorithm;
            });
        });

        return encryptionData;
    };

    return EncryptionHandler;
});