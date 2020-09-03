<?php
/* * * * * * * * * * * * *
 * Portal CMS version 2  *
 * File: worker.php		 *
 * File Build: 2.0.0.2   *
 * Author: Joe Jackson	 *
 * Date: 2/17/2013		 *
 * Description: Worker   *
 * that will handle all  *
 * database tasks. this  *
 * worker is accessed    *
 * via AJAX			     *
 * * * * * * * * * * * * */

/*ENUM operations*/
include "operations.php";
include "class.database.php";
include "sessions.php";

$DEBUG = true; // WARNING: this dumps a very verbose amount of data into a text file (debug.txt) set to false for use other than troubleshooting.

function get_db_entry($id)
{
	$database = new database;
    $query = $database->query("SELECT * FROM stories WHERE id='".$id."'","ROW");
    if (!$query){
        return false;
    }
    else
    {
        return $query;
    }
}

function get_db_entry_ids($start = 0, $limit = 3)
{
	$database = new database;
    $query = $database->query("SELECT id FROM stories ORDER BY date DESC LIMIT ".$start.", ".$limit,"FULL");
    if (!$query){
        return false;
    }
    else{
        return $query;   
    }
}

function error($log_text)
{
	if (!file_exists("error.txt")){
        return file_put_contents("error.txt", $log_text."\n\r");
    }
    else {
        return file_put_contents("error.txt", $log_text."\n\r", FILE_APPEND | LOCK_EX);
    }
}

function debug($debug_text){
    global $DEBUG;
    if ($DEBUG){
        if (!file_exists("debug.txt")){
            return file_put_contents("debug.txt", $debug_text."\n\r");
        }
        else {
            return file_put_contents("debug.txt", $debug_text."\n\r", FILE_APPEND | LOCK_EX);
        }
    }
}

function getsingle($storyId){
	$st = get_db_entry($storyId);
	if (!$st){
		$result = array("success"=>false, "data"=>"1 get_db_entry(".$storyId.") = FALSE - Unable to find story or open database connection. <-- getsingle(".$storyId.")");
	}
	else{
		$result = array("success"=>true, "data"=>$st);
	}
	echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}
function getall($offset = 0){ //(init)- Gets latest stories (MAX 3) from the database
	$ids = get_db_entry_ids(0+$offset, 3);
    if (!$ids){
        $result = array("success"=>false, "data"=>"1 get_db_entry_ids(0, 3) = FALSE - Unable to find stories or open database connection. <-- getall()");
    }
    else{
        $j = 0;
        $error = false;
        $story = array();
        foreach($ids as $i)
        {
            $story[$j] = get_db_entry($i[0]);
            if (!$story[$j])
            {
                $result = array("success"=>false, "data"=>"2 get_db_entry(".$storyId.") = FALSE - Unable to find story or open database connection. <-- getall() - STACK NUMBER ".$j." Exiting Loop.");
                $error = true;
                break;
            }
            $j++;
        }
        if (!$error)
            $result = array("success"=>true, "data"=>$story); // data.[title:TITLE,
    }
	echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}

function set_story($title, $author, $story, $data="<data></data>"){
    $database = new database;
    $date = time();
    $summary = $story;
    $summary = preg_replace("/<img[^>]+\>/i", "", $summary); // Remove images completely from summaries. TODO: better image support
    $summary = (strlen($summary) > 255)?substr($summary, 0, 245)."[...]":$summary; // We will make a summary automatically if needed.
    $q = "INSERT INTO stories (title, author, date, summary, story, comments, data)".
                           " VALUES ('$title', '$author', '$date', '$summary', '$story', 0, '$data')";
    debug($q);
    
    $query = $database->query($q,false);
    if (!$query){
        $result = array("success"=>false, "data"=>"set_story($title, $author, $date, $story, $data): Failed to add story to the database!!");
    }
    else
    {
        $query = $database->query("SELECT id FROM stories WHERE date='$date' LIMIT 1","ROW");
        if (!$query){
            $result = array("success"=>false, "data"=>"set_story($title, $author, $date, $story, $data): Failed to find inserted post's ID!!");
        }
        else{
            $result = array("success"=>true, "data"=>$query); 
        }
    }
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}

function update_story($id, $story){
    $database = new database;
    //$date = time();
    $summary = $story;
    $summary = preg_replace("/<img[^>]+\>/i", "(image) ", $summary); 
    $summary = (strlen($summary) > 255)?substr($summary, 0, 245)."[...]":$summary; // We will make a summary automatically if needed.
    $query = $database->query("SELECT * FROM stories WHERE id='$id' LIMIT 1","ROW");
    if (!$query){
        $result = array("success"=>false, "data"=>"update_story($id, $story): Failed to find inserted post's ID!!");
    }
    else{
        $q = "UPDATE stories SET story='$story', summary='$summary' WHERE id='$id'";
        debug($q);
        
        $query = $database->query($q,false);
        if (!$query){
            $result = array("success"=>false, "data"=>"update_story($id, $story): Failed to add story to the database!!");
        }
        else
        {
            $result = array("success"=>true, "data"=>$query); 
        }
    }
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}
function get_session(){
    $session = getSession();
    if (empty($session) || !$session){
        $data = array();
        $data['loggedin'] = false;
    }
    else{
        $data['loggedin'] = true;
        $user = getUserById($session['userid']);
        $data['user'] = $user;
    }
    $result = array("success"=>true, "data"=>$data); 
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}
function delete_story($id){
    $database = new database;
    return $database->query("DELETE FROM stories WHERE id='$id'",false);
}
function post_login($user, $pass, $long){
    $success = login($user, $pass, $long);
    $passfail = false;
    $userfail = false;
    if ($success === -2){
        $passfail = true;
    }
    if ($success === -1){
        $userfail = true;
    }
    $data = array("password"=>$passfail, "username"=>$userfail, "success"=>$success);
    //debug("success = ".(string) $success." ; userfail = ".(string) $userfail." ; passfail = ".(string) $passfail);
    if (!$passfail && !$userfail)
        $result = array("success"=>true, "data"=>"true"); 
    else
        $result = array("success"=>false, "data"=>$data); 
    
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}

function about_get(){
    $database = new database;
    $query = $database->query("SELECT * FROM siteinfo","ROW");
    $result = array("success"=>true, "data"=>$query); 
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}
function about_post($raw){
    $database = new database;
    $query = $database->query("UPDATE siteinfo SET about = '$raw' WHERE id='0'");
    $result = array("success"=>true, "data"=>$query); 
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}

function older_exists($offset){
    if (!get_db_entry_ids(3+$offset, 3))
        $result = array("success"=>true, "data"=>false);
    else
        $result = array("success"=>true, "data"=>true);
    
    echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);
}

function SetSessColr($r,$g,$b){
    $expire = time() + 2592000; // 30 days
    $arr = array("r"=>$r,"g"=>$g,"b"=>$b);
    $json = json_encode($arr);
    setcookie("portal2SessionClr", $json, $expire, "/");
}
$input = $_POST;

debug($input);
$operation = $input['op'];

switch ($operation){
	case operations::GET_ALL:
		getall();
		break;
	case operations::GET_SINGLE:
		getsingle($input['story_id']);
		break;
    case operations::POST_STORY:
        set_story($input['title'],$input['author'],$input['story']);
        break;
    case operations::EDIT_STORY:
        update_story($input['estory_id'],$input['story']);
        break;
    case operations::GET_SESSION:
        get_session();
        break;
    case operations::LOGIN_USER:
        post_login($input['username'],$input['password'],$input['long']);
        break;
    case operations::KILL_SESSION:
        killSession();
        break;
    case operations::DELETE_STORY:
        delete_story($input['dstory_id']);
        break;
    case operations::ABOUT_PAGE_GET:
        about_get();
        break;
    case operations::ABOUT_PAGE_POST:
        about_post($input['about']);
        break;
    case operations::GET_ALL_OFFSET:
        getall($input['offset']);
        break;
    case operations::OLDER_EXISTS:
        older_exists($input['curr_offset']);
        break;
    case operations::SESS_COLOR:
        SetSessColr($input['r'],$input['g'],$input['b']);
        break;
    default:
		error("invalid operation");
		break;
}

?>

