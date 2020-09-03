<?php
class operations{
	const GET_ALL = 1; // fetch all stories for the main page (max of 5)
	const GET_SINGLE = 2; // fetch a single story for the story page (also will fetch all comments)
	const POST_STORY = 3; // Store a story in the database.
	const POST_COMMENT = 4; // Store a comment in the database.
    const EDIT_STORY = 5;
    const GET_SESSION = 6;
    const LOGIN_USER = 7;
    const KILL_SESSION = 8;
    const DELETE_STORY = 9;
    const ABOUT_PAGE_GET = 10;
    const ABOUT_PAGE_POST = 11;
    const GET_ALL_OFFSET = 12;
    const OLDER_EXISTS = 13;
    const SESS_COLOR = 14;
}
?>