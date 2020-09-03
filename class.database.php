<?php
include_once('mysql2i.class.php');
class database {
	private $link;
	public $ERROR;

	const DEFAULT_HOST = "localhost";
	const DEFAULT_USER = "u415215357_p2";
	const DEFAULT_PASS = "Vm/6lVJCx4:";
	const DEFAULT_DB = "u415215357_p2";
	const DEFAULT_ERR_LOG = "database-errlog.txt";

	public function __construct() {
		$this->link = mysql_connect(self::DEFAULT_HOST, self::DEFAULT_USER, self::DEFAULT_PASS);

		mysql_select_db(self::DEFAULT_DB);

		if (!$this->link) {
			$this->ERROR = mysql_error($this->link);
			return false;
		}
		else
			return true;
	}

	public function logerr($error) {
		if (!file_exists(self::DEFAULT_ERR_LOG)){
			return file_put_contents(self::DEFAULT_ERR_LOG, $error."\n\r");
		}
		else {
			return file_put_contents(self::DEFAULT_ERR_LOG, $error."\n\r", FILE_APPEND | LOCK_EX);
		}
	}

	/**
	 * This method will query the database, in multiple ways, streamlined.
	 *
	 * @param string $query The query to be performed in MySQL Format
	 * @param mixed $return Options: false = Return boolean on success or failure; "ROW" = Returns a single row (1st) from the query in an array; "FULL" = Return a full array of all rows from the query.
	 * @return mixed Varies based on $return param, will return (bool)false if failed in all cases.
	 *
	 */
	public function query($query, $return = false) {
		if (!$return) {
			$result = mysql_query($query, $this->link);
			if (!$result) {
				$this->ERROR = mysql_error($this->link);
                $this->logerr("MY_ERROR: ".$this->ERROR);
				return false;
			}
			else
				return true;
		}
		elseif ($return == "ROW") {
			$result = mysql_query($query, $this->link);
			if (!$result) {
				$this->ERROR = mysql_error($this->link);
                $this->logerr("MY_ERROR: ".$this->ERROR);
				return false;
			}
			else {
				$row = mysql_fetch_array($result);
				return $row;
			}
		}
		elseif ($return == "FULL") {
			$result = mysql_query($query, $this->link);
			if (!$result){
				$this->ERROR = mysql_error($this->link);
                $this->logerr("MY_ERROR: ".$this->ERROR);
				return false;
			}
			else {
				$table = array();
				$i = 0;
				while ($row = mysql_fetch_array($result)) {
					$table[$i] = $row;
					$i++;
				}
				return $table;
			}
		}

	}
}
?>
