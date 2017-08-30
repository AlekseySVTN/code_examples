<?php

use S3\Folder;
use S3\Image;
use S3\Net\Request;
use S3\Query;
use S3\QueryType;
use S3\Shop2\Import;
use S3\Type;



/** @noinspection PhpIncludeInspection */
require_once ($_SERVER['DOCUMENT_ROOT'].'/../s3/bootstrap.php');


if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    return;
}
$s                     = Request::getStrFromPost('folder_ids','');
$user_id                     = Request::getIntFromPost('user_id',0);
$user_anonym_token                     = Request::getStrFromPost('user_anonym_token','');


$wrap= new \S3\Wrapper();
$site=$wrap->getSite();




$ver_id=$site["ver_id"];







$folder_ids = trim($s) != '' ? explode(',', $s) : [];



$queryClass = new Query();
$imageClass = new Image($ver_id);

$imageClass->ignoreWatermark(Request::getIntFromPost('ignore_watermark', FALSE));

// Get query
$image_type_id = Type::getId('image');



$replace_mode = "no-replace";
// Upload images

    if (!empty($_POST)) {
        try {

                $images = $imageClass->uploadImages('files', $replace_mode,$user_id,$user_anonym_token);

        } catch (\S3\Exception\LimitExceededException $e) {
            $error["error"]=('<script type="text/javascript">window.parent.uploader.error("'.$e->getMessage().'");$("#cancel-all").click();</script>');
            echo json_encode($error,JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Exception $e) {
            S3\Log::error($e);
            $error["error"]=('Error uploading');
            echo json_encode($error,JSON_UNESCAPED_UNICODE);
            exit;
        }
    } else {
        $images = Image::ERROR_UPLOAD;
    }

    // Handle errors
    if (!$images) {
        $error["error"]= ('Error. Couldn\'t upload files');
        echo json_encode($error,JSON_UNESCAPED_UNICODE);
    }

    if (is_numeric($images) || !is_array($images)) {			// error code

            if ($images == Image::ERROR_UPLOAD_NON_IMAGE_FILETYPE) {
                $error["error"]=(s3_localize("#UPLOAD_NON_IMAGE#"));
                echo json_encode($error,JSON_UNESCAPED_UNICODE);
                exit;
            } elseif ($images = 'Storage limit is exceeded') {
                $error["error"]=("<script type=\"text/javascript\">window.parent.uploader.error(window.parent.uploader.lang.errLimitExcceded);</script>");
                echo json_encode($error,JSON_UNESCAPED_UNICODE);
                exit;
            } else {
                $error["error"]=(s3_localize("#UPLOAD_ERROR#"));
                echo json_encode($error,JSON_UNESCAPED_UNICODE);
                exit;
            }

    }




$image_ver_id = S3::$ver_id;

// Assign folder IDs
foreach ($images as $image) {
    $folders = (array)Folder::getItemFolders($image_ver_id, $image_type_id, 0, $image['image_id']);
    $folder_ids = array_merge($folder_ids, $folders);
    Folder::changeItemFolders($image_ver_id, $image_type_id, 0, $image['image_id'], $folder_ids, 100, false);
}

\S3::setModified();



$res=array();
$res["images_info"]=array();
foreach ($images as $e) {
    $e['image_thumb'] = Image::getThumbnail($e['filename'], 1, 'r', isset($e['ver_id']) ? $e['ver_id'] : false);
    $e['folder_id']=$folder_ids[0];
    $res["data"] = "<div class=\"elem_item new_elem image_elem\"  style=\"background: url(/d/1327015/d/".$e['filename'].") center top no-repeat;    background-size: cover;\" data-folder_id=\"".$folder_ids[0]."\" data-image_id=\"".$e["image_id"]."\" ><div class=\"elem_item__pic\"><img src=\"/d/1327015/d/".$e['filename']."\" alt=\"\"></div></div>";
    $res["images_info"][$e["image_id"]]=$e;
}


// Надо через этот же аякс передать новы элемент в js массив IMAGES_BY_FOLDERS


echo json_encode($res,JSON_UNESCAPED_UNICODE);
