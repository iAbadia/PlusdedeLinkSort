// Storage initial config
chrome.storage.local.get('globalConfig', function (items) {
    if (items.globalConfig == undefined) {
        // Initialise values
        chrome.storage.local.set({ 'globalConfig': { 'active': true, 'quality': 'any', 'lang': 'any', 'subs': 'any' } }, function (itm) {
            chrome.storage.local.get('spec', function (items) {
                if (items.spec == undefined) {
                    items.spec = { 'serie': {}, 'peli': {} };
                    chrome.storage.local.set({ 'spec': items.spec }, function (itemsSpec) {
                        setInterval(checkLinks, 1000);
                    });
                } else {
                    setInterval(checkLinks, 1000);
                }
            });
        });
    } else {
        // Start checkLinks loop
        chrome.storage.local.get('spec', function (items) {
            if (items.spec == undefined) {
                items.spec = { 'serie': {}, 'peli': {} };
                chrome.storage.local.set({ 'spec': items.spec }, function (itemsSpec) {
                    setInterval(checkLinks, 1000);
                });
            } else {
                setInterval(checkLinks, 1000);
            }
        });
    }
});

// Define Node creator function
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

// Map saved lang value to HTML src image name
function toLang(lang) {
    switch (lang) {
        case 'esp':
            return 'spanish.png';
            break;
        case 'eng':
            return 'english.png';
            break;
        case 'lat':
            return 'latino.png';
            break;
        default:
            return null;
            break;
    }
}

// Check if links are shown
function displayedLinks() {
    var popupaportes = document.getElementsByClassName('popup-aportes');
    return popupaportes.length != 0;
}

// Create sorted links section
function createSortedLinksSection(type) {
    // Get links container
    var linksContainer = document.getElementById(type);

    // Create sortedHosts container
    var sortedHostsContainer = document.createElement("div");
    sortedHostsContainer.id = "pls-sorted-hosts-container-" + type;
    sortedHostsContainer.classList.add("pls-sorted-hosts-container");

    // Create and insert title + tooltip
    var titleWrap = document.createElement("div");      // Create wrapper for title + tooltip
    titleWrap.id = "pls-title-wrap-" + type;
    titleWrap.classList.add("pls-title-wrap");

    var h = document.createElement("H4");               // Create HTML elements
    var p = document.createElement("p");
    var tooltip = document.createElement("span");

    h.id = 'pls-title-sorted-links-' + type;                    // Assign some IDs
    h.classList.add("pls-title-sorted-links");
    p.id = 'pls-title-info-tooltip-' + type;
    p.classList.add("pls-title-info-tooltip");
    tooltip.id = "pls-title-info-tooltip-text-" + type;
    tooltip.classList.add("pls-title-info-tooltip-text");

    titleWrap.appendChild(h);                           // Title + tooltip inside wrapper
    titleWrap.appendChild(p);

    var t = document.createTextNode("Sorted Hosts");    // Create inside-text nodes
    var infoTooltip = document.createTextNode("");
    var tooltipText = document.createTextNode("Megadede Link Sort Extension");

    tooltip.appendChild(tooltipText);                   // Insert text into hidden span
    p.appendChild(infoTooltip);                         // Insert tooltip text into tooltip
    p.appendChild(tooltip);                             // Insert hidden span into tooltip
    h.appendChild(t);                                   // Insert Title text into title
    sortedHostsContainer.appendChild(titleWrap);

    // Create cotainer for links
    var sortedLinksContainer = document.createElement("div");   // Where links will be
    sortedLinksContainer.id = "pls-sorted-links-container-" + type;
    sortedLinksContainer.classList.add("pls-sorted-links-container");
    sortedHostsContainer.appendChild(sortedLinksContainer);

    // Insert before first (default) title
    var st = linksContainer.getElementsByTagName('h4')  // Get titles
    linksContainer.insertBefore(sortedHostsContainer, st[0]);
}

// Remove added title and links
function clearSortedLinksSection(type) {
    // Remove whole DIV
    if (displayedLinks()) {
        let section = document.getElementById("pls-sorted-hosts-container-" + type);
        section.parentNode.removeChild(section);
    }
}

// Type must be 'online' or 'download' (Online/Download link list IDs)
function sortLinks(type) {
    // Retrieve selected quality, lang and subs.
    if (displayedLinks()) {
        // Get peli/serie name
        var urlSplit = window.location.pathname.split('/');
        var urlType = urlSplit[urlSplit.length - 2];
        var urlName = urlSplit[urlSplit.length - 1];
        // Get spec JSON
        chrome.storage.local.get('spec', function (items) {
            // Use gloabl config
            chrome.storage.local.get('globalConfig', function (it) {
                // First time it wont exist
                if (items.spec[urlType][urlName] != undefined && items.spec[urlType][urlName].enable) {
                    linkQuality = items.spec[urlType][urlName].config.quality;
                    linkLang = items.spec[urlType][urlName].config.lang;
                    linkSubs = items.spec[urlType][urlName].config.subs;
                } else {
                    linkQuality = it.globalConfig.quality;
                    linkLang = it.globalConfig.lang;
                    linkSubs = it.globalConfig.subs;
                }

                // Get sorted links container
                var linksContainer = document.getElementById(type);
                var links = linksContainer.getElementsByClassName('aporte');
                links = Array.from(links);  // Convert HTMLCollection to JS Array

                // Check for no links
                if (links.length == 0) {
                    return;
                }

                // Sort by quality
                if (linkQuality != 'any') {
                    for (var i = 0; i < links.length; i += 1) {
                        if (!links[i].className.includes(linkQuality)) {
                            // Remove from array
                            links.splice(i, 1);
                            i -= 1; // Counter-update index
                        }
                    }
                }

                // Sort by Lang and sub
                for (var i = 0; i < links.length; i += 1) {
                    // Get flags
                    var langSubsFlags = links[i].getElementsByClassName('language')[0].getElementsByTagName('img');

                    // Check lang
                    if (linkLang != 'any') {
                        if (!langSubsFlags[0].src.includes(toLang(linkLang))) {
                            links.splice(i, 1);
                            i -= 1; // Counter-update index (we just altered the array length)
                            continue;   // Link removed, don't care about subs
                        }
                    }

                    // Check subs
                    if (linkSubs != 'any') {
                        // Remove if no subs but some sub selected OR sub selected but not matching lang
                        if ((langSubsFlags.length == 1 && linkSubs != 'none') ||
                            (langSubsFlags.length > 1 && !langSubsFlags[1].src.includes(toLang(linkSubs)))) {
                            links.splice(i, 1);
                            i -= 1; // Counter-update index (we just altered the array length)
                        }
                    }
                }

                // Insert links
                var sortedLinksContainer = document.getElementById("pls-sorted-links-container-" + type);
                if (links.length > 0) {
                    for (var i = 0; i < links.length; i += 1) {
                        sortedLinksContainer.appendChild(createElementFromHTML(links[i].outerHTML));
                    }
                } else {
                    let noLinksWarn = createElementFromHTML('<p> No links matching criteria </p>');
                    noLinksWarn.className = "alert alert-warning";  // Classes from Megadede's css
                    sortedLinksContainer.appendChild(noLinksWarn);
                }
            });
        });
    }
}

// Remove sorted links
function clearSortedLinks(type) {
    chrome.storage.local.get('globalConfig', function (items) {
        if (items.globalConfig.active == undefined || items.globalConfig.active) {
            // Check if links loaded
            if (displayedLinks()) {
                // Check if already sorted
                if (document.getElementById('pls-title-sorted-links-online') != null) { // Could test for either online or download
                    // Clear sorted links
                    let links = document.getElementById("pls-sorted-links-container-" + type);
                    while (links.firstChild) {
                        links.removeChild(links.firstChild);
                    }
                }
            }
        }
    });
}

// Check for links displayed and sort if active (periodically executed)
function checkLinks() {
    // Check if links are displayed
    if (displayedLinks()) {
        // Check if sorting active
        chrome.storage.local.get('globalConfig', function (items) {
            if (items.globalConfig.active == undefined || items.globalConfig.active) {
                // Check if already sorted
                if (document.getElementById('pls-title-sorted-links-online') == null) { // Could test for either online or download
                    // Sort links
                    createSortedLinksSection('online');
                    createSortedLinksSection('download');
                    sortLinks('online');
                    sortLinks('download');
                }
            }
        });
    }
}

// Updates listener (vendor specific)
function onMsgFirefox(message) {
    if (message.action != undefined) {
        // Sorting criteria or active change
        if (displayedLinks() && message.action.match(/^(quality|lang|subs|sync)$/)) {
            // Clear sorted hosts
            clearSortedLinks("online");
            clearSortedLinks("download");

            // Update sorted hosts
            sortLinks("online");
            sortLinks("download");
        } else if (displayedLinks() && message.action == "disable") {
            // Remove sorted hosts section
            clearSortedLinksSection("online");
            clearSortedLinksSection("download");
        }
    }
}
function onMsgChrome(request, sender, sendResponse) {
    if (!sender.tab) {
        onMsgFirefox(request);
    }
}
// Vendor test
var isChrome = navigator.userAgent.indexOf("Chrome") != -1;
var isFirefox = navigator.userAgent.indexOf("Firefox") != -1;

if (isChrome) {
    chrome.runtime.onMessage.addListener(onMsgChrome);
} else if (isFirefox) {
    chrome.runtime.onMessage.addListener(onMsgFirefox);
} else {
    console.error("SOMETHING IS VERY WRONG...");
}