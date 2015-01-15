
/* *******************************************************************************
 *
 * The Unix utility surfraw provides "... a fast ... command line interface to
 * a variety of popular search engines and other artifacts of power";  it
 * provides pre-packaged search on more than 100 sites, and also includes a
 * text-based bookmark facility with keyword lookup.
 *
 * See here for more details:
 *
 *    http://surfraw.alioth.debian.org/
 *
 * surfraw is a Unix utility;  this plugin, therefore, is for Unix and
 * Unix-like systems only.
 *
 * *******************************************************************************
 *
 * This is a Pentadactyl plugin; for more on Pentadactyl, see here:
 * http://dactyl.sourceforge.net/pentadactyl/
 *
 * This plugin provides an interface to surfraw from within
 * firefox/pentadactyl:
 *
 *    :surfraw wikipedia firefox                 (search Wikipedia for "firefox")
 *    :surfraw bookmark-keyword                  (open surfraw bookmark)
 *    :surfraw something else                    (sent to :open)
 *
 * In addition, this plugin installs new commands for each of the surfraw elvi;
 * there are more than 100, but just as examples, you get:
 *
 *    :google bbc news
 *    :google -l bbc news (if you're feeling lucky)
 *    :scroogle bbc news
 *    :wikipedia bbc news
 *    :youtube bbc news
 *    :yubnub random 42
 *
 * Installation:
 *    - place this file in "~/.pentadactyl/plugins/"; that's it.
 *
 * Copyright:
 *    Stephen Blott (smblott@gmail.com)
 *
 * License:
 *    MIT License
 *    http://opensource.org/licenses/mit-license.php
 */

/* *******************************************************************************
 *
 * TODO:
 *    - include a message in the installed documentation if surfraw is not
 *      available
 *    - add facility to define prefix on automatically-added surfraw command
 *      (google, wikipedia, etc.); why? there an awful lot of them
 *    - improve start-up time
 *    - completion on elvi arguments (at least for some of the more important
 *      elvi) -- need a more general way of doing this
 *    - this plugin must be restarted (":runtime plugins/surfraw.js") if new
 *      bookmarks are added or removed
 *
 * Version 0.15
 *    - release 2011/04/05
 *    - added support for surfraw bookmarks (specifically, completion)
 *    - added partial support for completion of arguments to some elvi
 *      (this is hand-coded, for now -- until a better way to do it becomes
 *      apparent)
 *    - bypass surfraw for surfraw bookmarks and searches for which the first
 *      term is a surfraw bookmark
 *      (this bypasses the unusual (broken?) semantics of surfraw's bookmark
 *      matching algorithm)
 *    - included a more sensible implementation of paging for :elvi
 *    - included a more sensible implementation of completion
 *      (although, it's still not great)
 *
 * Version 0.14
 *    - release 2011-04-03
 *    - add pentadactyl commands for each of the surfraw elvi
 *       :google x y z
 *       :youtube x y z
 *       :wikipedia x y z
 *       :yubnub x y z
 *       :scroogle x y z
 *      etc; there are more than one hundred elvi
 *    - added ':elvi' command (to list all available elvi)
 *    - improved documentation
 *    - don't install any commands if native surfraw is not found (but do
 *      install the documentation)
 *
 * Version 0.13
 *    - release 2011-02-06
 *    - recode to respect "use strict" restrictions (and hence load
 *      successfully on systems which enforce those restrictions)
 *    - this version seems to work on all combinations of firefox3/firefox4 and
 *      the current stable pentadactyl release (1.0b5) and recent pentadactyl
 *      snapshots
 */

/* *******************************************************************************
 * some preliminaries ...
 */

"use strict";

// XML.ignoreWhitespace = false;
// XML.prettyPrinting   = false;

/* *******************************************************************************
 * some messages ...
 */

var message = { no_surfraw:  "Cannot find 'surfraw' on your PATH\n(consider installing it and then restarting this plugin)",
                comp_ok:     "Available elvi and surfraw bookmarks",
                comp_not_ok: "No further completion available"
};

/* *******************************************************************************
 * the io.system() interface changed at some point in late 2010/early 2011;
 * this plugin works with both the new-style and the old-style io.system()
 * interfaces
 *
 * do we have a new-style or an old-style io.system() interface?
 */

var new_style_io_system = io.system("false").returnValue;
                          // 1         for new style io.system()
                          // undefined for old style io.system()

var error_code = 
    new_style_io_system
        ?   // new style
            function ( result )
            {
                return result.returnValue;
            }
        :   // old style
            function ( output )
            {
                if ( /\nshell returned (\d+)$/.test(output) )
                    return RegExp.$1;
                else
                    return 0;
            };

var output_from = 
    new_style_io_system
        ?   // new style
            function ( result )
            {
                return result.toString();
            }
        :   // old style
            function ( output )
            {
                return output;
            };

/* *******************************************************************************
 * START OF MAIN IMPLEMENTATION
 */

if ( io.pathSearch("surfraw") )
{
    /* *******************************************************************************
     * extract surfraw bookmarks (if any) ...
     */

    var surfraw_bookmark = "Surfraw bookmark: ";
    var bookmarks        = [];
    var bookmark_files   = [ "/usr/local/etc/xdg/surfraw/bookmarks",
                             "/etc/xdg/surfraw/bookmarks",
                             "~/.config/surfraw/bookmarks" ];

    bookmark_files
        .forEach(
            function ( file )
            {
                var output = io.system("cat " + file);

                if ( error_code(output) == 0 )
                    output_from(output)
                    .split("\n")
                    .forEach(
                        function ( entry )
                        {
                            entry = entry.split("#")[0]                           // strip comments
                                         .replace(/^\s*/, "").replace(/\s*$/, "") // trim whitespace
                                         .split(/\s+/);                           // parse
                            
                            if ( entry.length == 2 )
                                bookmarks.push( { name: entry[0],
                                                  desc: surfraw_bookmark + entry[1],
                                                  uri: entry[1] } );
                        } );
            } );

    /* *******************************************************************************
     * elvi argument completion ...
     *
     * it would be a whole heap better to extract the following information
     * directly from the elvi themselves; although that might be somewhat
     * computationally intensive (particularly at startup)
     *
     * also, while elvi that support additional options do report them with the
     * "-help" flag, they do not do so in a consistent format, nor is the
     * format used within the elvi scripts themselves sufficiently consistent
     * to extract the information from there
     *
     * the following are just the elvi that I can be bothered to enter (feel
     * free to submit extensions if there are any elvi you find to be
     * particularly useful or of general interested)
     */

    var elvi_arguments = {};

    elvi_arguments["google"] =
    [
        { name: "-l",                  desc: "Feeling lucky? Jump to first result." },
        { name: "-search=bsd",         desc: "BSD search." },
        { name: "-search=linux",       desc: "Linux search." },
        { name: "-search=mac",         desc: "Mac search." },
        { name: "-search=unclesam",    desc: "US Government search." },
        { name: "-search=images",      desc: "Image search." },
        { name: "-country=",           desc: "Select regional Google site." },
        { name: "-results=",           desc: "Number of search results to return." },
    ];

    elvi_arguments["wikipedia"] =
    [
        { name: "-l=",                 desc: "Language code." },
        { name: "-language=",          desc: "Language code." },
        { name: "-s",                  desc: "Use experimental HTTPS secure connection." },
    ];

    elvi_arguments["freebsd"] =
    [
        { name: "-mail=",              desc: "Search FreeBSD mailing lists (yes/no)." },
        { name: "-pr=",                desc: "Search FreeBSD problem reports (yes/no)." },
        { name: "-gg=",                desc: "Search FreeBSD mailing lists at Google Groups (yes/no)." },
        { name: "-cvs=",               desc: "Search FreeBSD CVSweb (yes/no)." },
        { name: "-mid=",               desc: "Search FreeBSD mailing lists by Message-ID (yes/no)." },
        { name: "-ps=",                desc: "Teleport to the Port Survey Page." },
        { name: "-psearch=all",        desc: "Search of type ALL in ports." },
        { name: "-psearch=name",       desc: "Search of type PACKAGE NAME in ports." },
        { name: "-psearch=text",       desc: "Search of type DESCRIPION in ports." },
        { name: "-psearch=pkgdescr",   desc: "Search of type LONG DESCRIPION in ports." },
        { name: "-psearch=maintainer", desc: "Search of type MAINTAINER in ports." },
        { name: "-psearch=requires",   desc: "Search of type REQUIRES in ports." },
        { name: "-psection=",          desc: "Section of ports to search in." },
    ];

    elvi_arguments["bbcnews"] =
    [
        { name: "-scope=world",        desc: "Search world news." },
        { name: "-scope=uk",           desc: "Search UK news." },
    ];

    elvi_arguments["ebay"] =
    [
        { name: "-country=",           desc: "Country specific ebay sites (two-letter codes, or set SURFRAW_ebay_country)." },
        { name: "-c=",                 desc: "Country specific ebay sites (two-letter codes, or set SURFRAW_ebay_country)." },
        { name: "-results=",           desc: "Results per page." },
        { name: "-r=",                 desc: "Results per page." },
    ];

    elvi_arguments["scroogle"] =
    [
        { name: "-lang=",              desc: "Language specific search (two-letter codes)." },
        { name: "-results=",           desc: "Results per page." },
        { name: "-nossl",              desc: "Don't use HTTPS." },
    ];

    elvi_arguments["wayback"] =
    [
        { name: "-syear=",             desc: "Start search from this year (NUM)." },
        { name: "-smonth=",            desc: "Start search from this month (jan|feb|mar|...)." },
        { name: "-sday=",              desc: "Start search from this day (NUM)." },
        { name: "-eyear=",             desc: "End search at this year (NUM)." },
        { name: "-emonth=",            desc: "End search at this month (jan|feb|mar|...)." },
        { name: "-eday=",              desc: "End search at this day (NUM)." },
        { name: "-type=image",         desc: "Set search type as IMAGE." },
        { name: "-type=audio",         desc: "Set search type as AUDIO." },
        { name: "-type=video",         desc: "Set search type as VIDEO." },
        { name: "-type=binary",        desc: "Set search type as BINARY." },
        { name: "-type=text",          desc: "Set search type as TEXT." },
        { name: "-type=pdf",           desc: "Set search type as PDF." },
    ];

    elvi_arguments["webster"] =
    [
        { name: "-t",                  desc: "Search in thesaurus" },
    ];

    // the following Amazon "-search=..." options are from the list of UK
    // sections

    elvi_arguments["amazon"] =
    [
        { name: "-country=",                   desc: "Two letter domain-style country code (or set SURFRAW_amazon_country" },
        { name: "-search=books",               desc: "Books" },
        { name: "-search=electronics",         desc: "Electronics" },
        { name: "-search=popular",             desc: "Music" },
        { name: "-search=classical",           desc: "Classical Music" },
        { name: "-search=digital-music",       desc: "MP3 Downloads" },
        { name: "-search=dvd",                 desc: "DVD" },
        { name: "-search=vhs",                 desc: "VHS" },
        { name: "-search=software",            desc: "Software" },
        { name: "-search=videogames",          desc: "Video Games" },
        { name: "-search=software-videogames", desc: "& Games" },
        { name: "-search=diy",                 desc: "DIY & Tools" },
        { name: "-search=outdoor",             desc: "Garden & Outdoors" },
        { name: "-search=kitchen",             desc: "Kitchen & Home" },
        { name: "-search=drugstore",           desc: "Health & Beauty" },
        { name: "-search=beauty",              desc: "Beauty" },
        { name: "-search=toys",                desc: "Toys & Games" },
        { name: "-search=sports",              desc: "Sports & Leisure" },
        { name: "-search=jewelry-watches",     desc: "Jewellery & Watches" },
        { name: "-search=clothing",            desc: "Clothing" },
        { name: "-search=shoes",               desc: "Shoes & Accessories" },
        { name: "-search=baby",                desc: "Baby" },
    ];

    /* *******************************************************************************
     * elvi completion ...
     */

    var title = [       "ELVI",              "DESCRIPTION" ];
    var keys  = { text: "name", description: "desc"        };

    var elvi  = // ask surfraw what elvi are available
                io.system("surfraw -elvi")
                // split them, one per line
                .split("\n")
                // for each, generate an entry
                //   "name": the name of the elvi
                //   "desc": its description
                .map
                (
                    function(line)
                    {
                        var parse = line.split(/\s+--\s+/);
                        return { name: parse[0], desc: parse[1] };
                    }
                )
                // keep only the useful ones:
                //   1. if e["desc"] is undefined, then it's not an elvi
                //   2. skip the "Activate Browser" elvi (W), it's not useful here
                .filter
                (
                    function(e) e["desc"] && e["name"] != "W"
                )
                // and add in the bookmarks (from above)
                .concat(bookmarks);
    
    var elvi_completer = 
        function ( context, position )
        {
            var strs = context.value.split(/\s+/);

            if ( strs.length < position )
            {
                // shouldn't happen
                dactyl.log("elvi_completer: strs.length < position");
            }
            else
            if ( strs.length == position )
            {
                context.message     = message["comp_ok"];
                context.title       = title;
                context.keys        = keys;
                context.completions = elvi;
                return context;
            }
            else
            {
                if ( strs.length == position + 1 )
                {
                    if ( elvi_arguments[strs[position]] )
                        context.message     = message["comp_ok"];
                        context.title       = [ "OPTION", "DESCRIPTION" ];
                        context.keys        = keys;
                        context.completions = elvi_arguments[strs[position-1]];
                        return context;
                }
                context.message = message["comp_not_ok"];
                return context;
            }
            // should not reach here
            dactyl.log("elvi_completer: should not reach here");
            return context;
        };

    /* *******************************************************************************
     * the main surfraw function/commands ...
     */

    var surfraw_print_command = "surfraw -print ";
    var surfraw_things = {};

    elvi.forEach( function(e) { surfraw_things[ e["name"] ] = e } )

    var surfraw =
        function ( args, where )
        {
            var flat_args = args.join(" ");

            if ( surfraw_things[args[0]] && surfraw_things[args[0]]["uri"] )
            // the first term of args is a surfraw bookmark
            {
                if ( args.length == 1 )
                    // open the bookmark directly
                    return dactyl.open( surfraw_things[args[0]]["uri"], { where: where } );
                else
                    // bypass surfraw if there are multiple arguments but the
                    // first is a bookmark (the surfraw bookmark logic is
                    // unusual in this case, in fact, it's arguably broken)
                    return dactyl.open( flat_args, { where: where } );
            }

            var result = io.system(surfraw_print_command + flat_args);
            return dactyl.open( error_code(result) == 0
                                    ? output_from(result)
                                    : flat_args,
                                { where: where } );
        };

    var register_surfraw_command =
        function ( commands, description, where )
            commands.forEach(
                function ( command )
                    group.commands.add
                        ( [ command ],                                      // the command name
                          description,                                      // its description
                          function (args) { return surfraw(args, where); }, // its implementation
                          { argCount: "+",
                            completer: function (context) { return elvi_completer(context, 2); },
                          },                                                // extra stuff
                          true                                              // replace the currently implementation
                        ) );

    var desc_cur = "Open a URI suggested by surfraw";
    var desc_new = desc_cur + " in a new tab";
    var desc_win = desc_cur + " in a new window";

    register_surfraw_command( [ "surfraw",  "sr"  ], desc_cur, dactyl.CURRENT_TAB );
    register_surfraw_command( [ "tsurfraw", "tsr" ], desc_new, dactyl.NEW_TAB     );
    register_surfraw_command( [ "wsurfraw", "wsr" ], desc_win, dactyl.NEW_WINDOW  );

    /* *******************************************************************************
     * register individual elvi commands ...
     */

    var elvi_command =
        function (e)
        {
            return function (args)
            {
                args.unshift(e);
                return surfraw(args, dactyl.CURRENT_TAB);
            }
        };

    var elvi_command_completer =
        function (context)
        {
            return elvi_completer(context, 1);
        }

    elvi
    .filter
        (
            // include only those which are not bookmarks
            function(e) { return e['uri'] == undefined; }
        )
        .forEach(
            function ( e )
                group.commands.add
                (
                    [ e["name"] ],                   // the command name
                    e["desc"],                       // its description
                    elvi_command(e["name"]),         // its implementation
                    { argCount: "*",                 // extra stuff
                      completer: elvi_command_completer,
                    },                               
                    true                             // replace the current implementation
                )
        );

    /* *******************************************************************************
     * register the command to list available elvi ...
     */

    var list_elvi =
        function(args)
            dactyl.echo
            (
                "Surfraw elvi:\n" +
                 elvi
                 .filter
                     (
                         // include only those which are not bookmarks
                         function(e) { return e['uri'] == undefined; }
                     )
                    .sort
                    (
                        function (a, b) { return a["name"] < b["name"] }
                    )
                    .reduce
                    (
                        // the following assumes that the accumulator is the
                        // second argument;  I haven't seen that formally
                        // documented anywhere
                        function (a,e)
                        {
                            // surely Javascript has something like printf?
                            return ( e["name"] + Array(20).join(" ") ).substr(0,20)
                                     + " - "
                                     + e["desc"]
                                     + "\n"
                                     + a
                        }, "" )
            );

    group.commands.add( [ "elvi" ],                         // the command name
                        "List all available surfraw elvi.", // its description
                        list_elvi,                          // its implementation
                        { argCount: "0" },                  // extra stuff
                        true );                             // replace the current implementation

} // end: if ( io.pathSearch("surfraw") )
else
{
    dactyl.echomsg(message["no_surfraw"]);
}

/* *******************************************************************************
 * END OF MAIN IMPLEMENTATION
 *
 * surfraw plugin documentation ...
 */

// var INFO =
//     <plugin name="surfraw" version="0.14"
//             href="http://code.google.com/p/dactyl/issues/detail?id=320"
//             summary="Open a URI suggested by surfraw."
//             xmlns={NS}>
//         <author email="smblott@gmail.com">Stephen Blott</author>
//         <license href="http://opensource.org/licenses/mit-license.php">MIT</license>
//         <project name="Pentadactyl" min-version="1.0"/>

//         <p>
//             The Unix utility <tt>surfraw</tt> provides "... a fast ...  command
//             line interface to a variety of popular search engines and other
//             artifacts of power".  It includes interfaces to more than one
//             hundred web sites and search engines, and a text/keyword-based
//             bookmarking facility.
//         </p>

//         <p>
//             This plugin makes <tt>surfraw</tt> callable from the
//             Firefox/Pentadactyl command line. The new <ex>:surfraw</ex> command
//             (and its related commands) looks up a URI using <tt>surfraw</tt>
//             and opens the URI suggested, or -- if <tt>surfraw</tt> fails to
//             suggest a URI -- passes its arguments to Pentadactyl's built-in
//             <ex>:open</ex> command.
//         </p>

//         <p>
//             This plugin requires <tt>surfraw</tt> to be installed on your
//             system; <tt>surfraw</tt> is available for Unix and most Unix-like
//             operating systems.  It is available as port <tt>www/surfraw</tt> on
//             FreeBSD, and as package <tt>surfraw</tt> on Ubuntu; it is doubtless
//             available in similarly-named packages on other systems.  As a
//             consequence of this dependency, this plugin is for Unix and
//             Unix-like systems only.
//         </p>

//         <p>
//             If the native <tt>surfraw</tt> command is not found on your system
//             (based on the PATH environment variable) when this plugin is
//             loaded, then none of the following commands will be installed
//             (although this documentation will be).  Should you subsequently install
//             <tt>surfraw</tt>, then you will have to reload this plugin (or
//             restart firefox) to activate these commands.
//         </p>

//         <item>
//             <tags>:sr :surfraw</tags>
//             <spec>:surfraw <a>surfraw-arguments</a> </spec>
//             <description>
//                 <p>
//                     Pass <a>surfraw-arguments</a> to '<tt>surfraw -print</tt>'
//                     and open the resulting URI.  If <tt>surfraw</tt> fails to
//                     suggest a URI, then instead just pass
//                     <a>surfraw-arguments</a> to Pentadactyl's built-in
//                     <ex>:open</ex> command.
//                 </p>

//                 <example><ex>:surfraw wikipedia firefox</ex><k name="CR"/></example>
//                 <p>
//                     Look up <ex>firefox</ex> on Wikipedia, <ex>wikipedia</ex> being
//                     one of the standard <tt>surfraw</tt> elvi (of which there are many; try
//                     '<tt>surfraw -elvi</tt>' on the shell command line to see a list of
//                     those available on your system).
//                 </p>

//                 <example><ex>:surfraw google -l pentadactyl</ex><k name="CR"/></example>
//                 <p>
//                     Look up <ex>pentadactyl</ex> on Google and go straight there
//                     (the <ex>-l</ex> argument to the <ex>google</ex> elvi
//                      activates "I'm feeling lucky" mode).
//                 </p>

//                 <example><ex>:rhyme -method=perfect Nantucket</ex><k name="CR"/></example>
//                 <p>
//                     Look up a perfect rhyme for <ex>Nantucket</ex>.
//                 </p>

//                 <example><ex>:surfraw surfraw-bookmark</ex><k name="CR"/></example>
//                 <p>
//                     Open the <tt>surfraw</tt> bookmark with keyword <ex>surfraw-bookmark</ex>.
//                 </p>

//                 <example><ex>:surfraw some search terms</ex><k name="CR"/></example>
//                 <p>
//                     In general, <tt>surfraw</tt> will not know what to do with <ex>some search
//                     terms</ex>, so they are passed to Pentadactyl's
//                     <ex>:open</ex> command (which in turn will likely pass them
//                     on to your favourite search engine).
//                 </p>

//                 <example><ex>nmap o :surfraw</ex><k name="SPACE"/></example>
//                 <p>
//                     Use <ex>:surfraw</ex> instead of <ex>:open</ex> (after all, it'll
//                     just call <ex>:open</ex> itself if it can't figure out what to
//                     do).
//                 <p>
//                 </p>
//                     A disadvantage of this binding is that completion for
//                     <ex>:surfraw</ex> is less extensive than it is for
//                     <ex>:open</ex>.  On the other hand, given the visual jitter of completion
//                     and the computational costs that certain completion contexts
//                     incur, some may not see this as such a bad thing.
//                 </p>
//             </description>
//         </item>

//         <item>
//             <tags>:tsr :tsurfraw</tags>
//             <spec>:tsurfraw <a>surfraw-arguments</a> </spec>
//             <description>
//                 <p>
//                     As above, except that the URI is opened in a new tab (or
//                     <a>surfraw-arguments</a> are passed to the
//                     <ex>:tabopen</ex> command).
//                 </p>
//             </description>
//         </item>

//         <item>
//             <tags>:wsr :wsurfraw</tags>
//             <spec>:wsurfraw <a>surfraw-arguments</a> </spec>
//             <description>
//                 <p>
//                     As above, except that the URI is opened in a new window (or
//                     <a>surfraw-arguments</a> are passed to the
//                     <ex>:winopen</ex> command).
//                 </p>
//             </description>
//         </item>

//         <item>
//             <tags>:elvi</tags>
//             <spec>:elvi</spec>
//             <description>
//                 <p>
//                     Display a list of the available elvi.
//                 </p>
//             </description>
//         </item>

//         <p>
//         Surfraw includes 'elvi' (as surfraw wrappers are called) for a little
//         over one-hundred search engines and web sites, and many of those elvi
//         take flags which adapt their functionality.  For example, the
//         <ex>google</ex> elvi takes a <ex>-l</ex> flag to turn on "I'm feeling
//         lucky" mode, and the <ex>wikipedia</ex> elvi takes a <ex>-l</ex> flag
//         for selecting the desired language and a <ex>-s</ex> flag for enabling
//         SSL (see examples, below).
//         <p>
        
//         </p>
//         This plugin also installs Pentadactyl commands for all of these elvi,
//         and these elvi commands accept flags just as their native counterparts
//         do.  The following are just some examples.
//         </p>

//         <item>
//             <tags>:wikipedia</tags>
//             <spec>:wikipedia -l=DE Berlin </spec>
//             <description>
//                 <p>
//                 Look up the <ex>Berlin</ex> page on Wikipedia, but in German.
//                 </p>
//             </description>
//         </item>

//         <item>
//             <tags>:google</tags>
//             <spec>:google -results=50 -search=bsd geli</spec>
//             <description>
//                 Look up <ex>geli</ex> in Google's <ex>bsd</ex>-specific search
//                 mode, returning <ex>50</ex> results.
//             </description>
//         </item>

//         <item>
//             <tags>:rhyme</tags>
//             <spec>:rhyme chimney </spec>
//             <description>
//                 Look up a rhyme for <ex>chimney</ex>.
//             </description>
//         </item>

//         <item>
//             <tags>:yubnub</tags>
//             <spec>:yubnub random 42 </spec>
//             <description>
//                  Use <ex>yubnub</ex> to generate a random number.
//             </description>
//         </item>

//         <item>
//             <tags>:youtube</tags>
//             <spec>:youtube meaning of life </spec>
//             <description>
//                  Look up the <ex>meaning of life</ex> on <ex>youtube</ex>.
//             </description>
//         </item>

//         <item>
//             <tags>:lastfm</tags>
//             <spec>:lastfm <ex>Justin Bieber</ex> </spec>
//             <description>
//                  Look up <ex>Justin Bieber</ex> on Last FM.
//             </description>
//         </item>
//     </plugin>;

/* vim:se sts=4 sw=4 et: */

