const express = require("express");
const router = express.Router();
const upload=require('../middlewares/uploadmedia.middlewares');
const library=require('../controllers/library.controller');
const playlist=require('../controllers/playlists.controller');
const groupScreen = require("../controllers/groupScreen.controller");
const db = require("../config/dbConnection");
const cron = require('node-cron');
// router.get("/PlaylistEdit/plylistEditScreen", (req, res) => {
//   res.render("selectionNewPlaylist");
// });
//  router.get('/',playlist.showPlaylist) //////       first comment  11:25
router.get("/newPlaylist", library.viewMediaForPlaylist);
router.get("/Photoes", library.getPhotoesForPlaylist);
router.get("/Videos", library.getVideosForPlaylist);
router.post("/UploadFile",upload.single('file'), library.handleUploadInDBForNewPlaylist);
router.post('/createPlaylist',playlist.createPlaylist)
router.post('/editPlaylist',playlist.editPlaylist)
router.get("/PlaylistEdit/plylistEditScreen",playlist.showAvailableScreenForEditPlaylist)
// router.get("/PlaylistEdit/:playlistId",playlist.getPlaylistById)  //// second comment 12:02
// router.get("/PlaylistDelete/:playlistId",playlist.deletePlaylist)
router.post("/PlaylistDelete/:playlistId", playlist.deletePlaylist);

router.get("/newPlaylist/selectScreens",playlist.showAvailableScreen)

router.post('/save-playlist', async (req, res) => {
    const {
        playlistname,
        playlistdescription,
        screen_id,
        ...slots
    } = req.body;

    // Log incoming data for debugging
    console.log("playlistname:", playlistname);
    console.log("playlistdescription:", playlistdescription);
    console.log("screen_id:", screen_id);
    console.log("Slots data:", slots);

    // Validate required fields
    if (!playlistname || !playlistdescription || !screen_id) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    // Create dynamic slot columns and values
    const slotColumns = [];
    const slotValues = [];
    const queryParams = [playlistname, playlistdescription, screen_id];

    for (const [key, slotData] of Object.entries(slots)) {
        if (typeof slotData === 'object' && slotData !== null) {
            for (const [slotKey, slotValue] of Object.entries(slotData)) {
                if (slotKey.endsWith('_updatetime') || slotKey.endsWith('_deletetime') || slotKey.startsWith('slot')) {
                    slotColumns.push(slotKey);
    
                    if (Array.isArray(slotValue)) {
                        // Format the array correctly for PostgreSQL
                        const formattedArray = `{${slotValue.map(v => `"${v.replace(/"/g, '""')}"`).join(',')}}`;
                        slotValues.push(formattedArray);
                    } else {
                        slotValues.push(slotValue);
                    }
                }
            }
        }
    }

    if (slotColumns.length === 0) {
        console.log("No valid slots found in the request.");
        return res.status(400).json({ status: 'error', message: 'No slots provided' });
    }

    // Construct query with conditional columns
    const columnsPart = ['playlistname', 'playlistdescription', 'screen_id', ...slotColumns].join(', ');
    const valuesPart = ['$1', '$2', '$3', ...slotValues.map((_, i) => `$${i + 4}`)].join(', ');

    const query = `
        INSERT INTO public.playlists1235 (
            ${columnsPart}
        ) VALUES (
            ${valuesPart}
        )
    `;

    console.log("SQL Query:", query);
    console.log("Values:", [...queryParams, ...slotValues]);

    // Execute query
    try {
        await db.query(query, [...queryParams, ...slotValues]);
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Error executing query:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to save playlist', error: error.message });
    }  
});


//  making showplaylist  function for  edit function : 11:25 



router.get('/', async (req,res)=>{
    try {
        const { rows: playlists } = await db.query("SELECT * FROM playlists1235");

    // console.log("playlists Datys:",playlists);
    
    // res.send('hi from playlist')
    res.render('Playlist', { playlists });
    } catch (error) {
        console.error("Error fetching playlists:", error);
        res.status(500).send("An error occurred while fetching playlists.");
    }
})
//  making   function for  edit playlist function : 12:02


// router.get("/PlaylistEdit/:playlistId", async (req, res) => {
//     const playlistId = req.params.playlistId;
//     try {
//       const playlist = await db.query('SELECT * FROM playlists1235 WHERE id = $1', [playlistId]);
  
//       if (playlist.rowCount === 0) {
//         console.error('Playlist not found');
//         return res.status(404).send('Playlist not found');
//       }
  
//       const mediafiles = await library.viewMediaForPlaylist1();
//       const convertedMediaFiles = mediafiles.map(file => {
//         const durationString = intervalToString(file.duration);
//         return { ...file, durationString };
//       });
  
//       res.render('editPlaylist', { playlist: playlist.rows[0], mediafiles: convertedMediaFiles });
//     } catch (error) {
//       console.error('Error fetching playlist editPlaylist :', error);
//       res.status(500).send('Internal Server Error');
//     }
//   });
router.get("/PlaylistEdit/:playlistId",playlist.getPlaylistById1) 


// function intervalToString(interval) {
//     if (!interval) {
//         return '';
//       }
//     const hours = interval.hours ? `${interval.hours}h ` : '';
//     const minutes = interval.minutes ? `${interval.minutes}m ` : '';
//     const seconds = interval.seconds ? `${interval.seconds} sec` : '';
//     return `${hours}${minutes}${seconds}`.trim();
//   }


module.exports = router;
