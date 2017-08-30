<?php

namespace S3\Plugin;

use S3\DataExchange;
use S3;
use S3\Exception\User\UserException;
use S3\PluginEngine;
use Viron\State;

/**
 * Class UserPlugin
 * @package S3\Plugin
 */
class UserPlugin {
    protected $request;

    protected $ver_id;
    /** @var array */
    protected $page;
    /** @var array */
    protected $user;

    protected $user_settings;

    protected $custom_fields;

    private $site_protocol = "http";

    /**
     * @param PluginEngine $plugin
     * @throws \Exception
     */
    public function __construct(PluginEngine $plugin) {
        $this->ver_id = $plugin->ver_id;
        $this->page = $plugin->page;
        $this->page['noindex'] = 1;
        $this->user = $plugin->user;

        $this->user_settings = S3\User::getSettings();


        if (!empty($this->user_settings['available_fields'])) {
            $this->custom_fields = S3\UserSettings::getCustomFields($this->ver_id, $this->user_settings['available_fields']);
        }

        $this->request = $plugin->getRequest();
        $return_url = isset($this->request->params['return_url']) ? $this->request->params['return_url'] : '';
        if ($return_url && !S3\User::isLogged()) {
            $this->request->setCookie('return_url', $return_url, 60 * 60 * 24 * 10);
        }
        $this->site_protocol = \S3::getProtocol($plugin->ver_id);
        /** @var Render $render */
        $render = $plugin->render;
        $render->addCommon([
            'mode'          => isset($this->request->options['mode']) ? $this->request->options['mode'] : 'login',
            'return_url'    => $return_url,
            'login_error'   => false,
            'login_done'    => !empty($this->user),
            '&user'         => $this->user,
        ]);
    }

    /**
     * Основное действие - авторизация
     * @param bool $remember
     * @param string $login
     * @param string $password
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function indexAction($remember = false, $login = null, $password = null) {
        return $this->loginAction($remember, $login, $password);
    }


    public function sendOrderAction($data_project,$price_project,$data_previews,$project_name){



        $user=S3\User::getUser();
        if($user){
            $order=S3\Shop2\Shop2Order::addOrder($price_project,$data_project,$user,$data_previews,$project_name);
            throw State::redirect("//" . $this->request->name .$this->page['url'] .'?mode=settings&status=sendOrder&order_id='.$order["order_id"], 302);
        }

    }


    /**
     * Форма авторизации
     * @param bool $remember
     * @param string $login
     * @param string $password
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function loginAction($remember = false, $login = null, $password = null) {
        $result = [];
        if (!is_null($login) && !is_null($password)) {
            try {
                $this->user = S3\User::login($login, $password, $remember);
            } catch (UserException $e) {
                $result['login_error'] = $e->getMessage();
            }

            if ($this->user) { // Logged in


                $anonym_token=S3\User::getTokenJust();
                if($anonym_token){
                    S3\Image::changeImageOwner($anonym_token,$this->user["user_id"]);
                }

                if(S3\Net\Request::getStrFromPost("quick_auth")==1){
                    $user=S3\User::getById($this->ver_id,$this->user["user_id"]);
                    if($user){


                        $data_project=S3\Net\Request::getStrFromPost("data_project");
                        $price_project=S3\Net\Request::getStrFromPost("price_project");
                        $data_previews=S3\Net\Request::getStrFromPost("data_previews");
                        $project_name=S3\Net\Request::getStrFromPost("project_name");



                        $order=S3\Shop2\Shop2Order::addOrder($price_project,$data_project,$user,$data_previews,$project_name);
                        throw State::redirect("//" . $this->request->name .$this->page['url'] .'?mode=settings&status=sendOrder&order_id='.$order["order_id"], 302);
                    }
                }


                // Return URL cookie
                if (!empty($this->request->cookie['return_url'])) {
                    $this->request->setCookie('return_url', '', -1000); // удаление куки
                    throw State::redirect($this->request->cookie['return_url'], 302);
                }
                // Forward to HTTP_REFERER or to homepage
                if ($this->request->referrer) {
                    throw State::redirect($this->request->referrer ?: "/", 302);
                }
                throw State::redirect('//' .$this->request->name . $this->request->uri, 302);
            }
        } elseif ($this->user) { // Logged in
            $result['login_done'] = true;
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=home", 302);
        }
        return $result;
    }

    /**
     * Выход из аккаунта
     * @throws State\Redirect
     */
    public function logoutAction() {
        S3\User::logout();
        if ($this->request->referrer) {
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=login", 302);
        } else {
            throw State::redirect('/', 302);
        }
    }

    /**
     * Мой кабинет
     * @return mixed
     * @throws State\Redirect
     */
    public function homeAction() {
        if (S3\User::isLogged()) {

            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=settings", 302);

            /*
            $result = $this->user_settings;

            $form = new S3\Form\UserInfoForm($this->custom_fields);
            $form->edit_mode    = S3\User::isLogged();
            $form->ver_id       = $this->ver_id;
            $form->userSettings = S3\User::getSettings();
            $form->execute();
            $result['info_form'] = $form;

            $shop2_id = S3\Shop2::getId();
            if ($shop2_id) {
                $filter = [
                    "user_id" => $this->user['user_id'],
                    "archive" => 0
                ];

                $result['num_orders'] = S3\Shop2\Shop2Order::countOrders($shop2_id, $filter);
            }

            return $result;
            */
        } else {
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=login", 302);
        }
    }

    /**
     * Форма регистрации
     * @param bool $status
     * @param int $subscribe
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function registerAction($status = false, $subscribe = null) {
        if (S3\User::isLogged()) {
            throw State::redirect("//" . $this->request->name .$this->page['url'] .'?mode=settings', 302);
        }

        // Если закрыта регистрация:
        if (!S3\User::getSetting('registration_opened')) {
            return [];
        }
        // Успешно зарегистрировались:
        if ($status) {
            return [];
        }

        $form               = new S3\Form\UserRegisterForm($this->custom_fields);
        $form->ver_id       = $this->ver_id;
        $form->userSettings = $this->user_settings;
        $form->execute();

        if ($form->done && !$form->error) {
            if (!$this->user = S3\User::getByUserId($form->getControlValue('user_id'))) {
                throw new \ErrorException("Registration failed!");
            }
            $this->user['groups'] = S3\User::getUserGroups($this->user['user_id'], true);

                if(S3\Net\Request::getStrFromPost("quick_reg")==1){


                    $k = S3\User::getActivationKey($this->user['user_id']);
                    $this->user['activation_url'] = "{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=activation&i={$this->user['user_id']}&key=$k";
                    $this->user['site_domain'] = S3::$site['site_domain'];

                    S3::getServices()->action("registerUser", $this->user);

                    $activated = S3\User::activate($this->user['user_id']);


                    $anonym_token=S3\User::getTokenJust();
                    if($anonym_token){
                        S3\Image::changeImageOwner($anonym_token,$this->user["user_id"]);
                    }

                    if ($activated) {
                        $login=S3\User::doLogin($this->user['user_id']);

                        $user=S3\User::getById($this->ver_id,$this->user['user_id']);
                        if($user){


                            $data_project=S3\Net\Request::getStrFromPost("data_project");
                            $price_project=S3\Net\Request::getStrFromPost("price_project");
                            $data_previews=S3\Net\Request::getStrFromPost("data_previews");
                            $project_name=S3\Net\Request::getStrFromPost("project_name");



                            $order=S3\Shop2\Shop2Order::addOrder($price_project,$data_project,$user,$data_previews,$project_name);

                        }
                    }






                    $this->registrationMail($form);

                    // успешная регистрация - редирект на текущую страницу со статусом
    //			throw State::redirect('//' . $this->request->name .$this->request->uri . '?status=1', 302);
                    throw State::redirect("//" . $this->request->name .$this->page['url'] .'?mode=settings&status=sendOrder&reg=1&order_id='.$order["order_id"], 302);

                }else {
                    $k = S3\User::getActivationKey($this->user['user_id']);
                    $this->user['activation_url'] = "{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=activation&i={$this->user['user_id']}&key=$k";
                    $this->user['site_domain'] = S3::$site['site_domain'];
                    S3::getServices()->action("registerUser", $this->user);
                    $this->dexQueue($subscribe);
                    $this->registrationMail($form);
                    // успешная регистрация - редирект на текущую страницу со статусом
    //			throw State::redirect('//' . $this->request->name .$this->request->uri . '?status=1', 302);
                    throw State::redirect("//" . $this->request->name . $this->page['url'] . '?mode=register&status=1', 302);
                }
            } else {
            return ['form' => $form];
        }
    }

    /**
     * Редактирование данных пользователя
     * @param bool $status
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function userAction($status = false) {
        return $this->editAction($status);
    }

    /**
     * Редактирование данных пользователя
     * @param bool $status
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function editAction($status = false) {
        throw State::redirect("//" . $this->request->name .$this->page['url'] .'?mode=settings', 302);
    }

  
   
  

    /**
     * Настройка пользователя
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function settingsAction() {
        if (!S3\User::isLogged()) {
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}", 302);
        }

        if ($template_id = S3\Template::getFitIdByName('user.settings.tpl', $this->ver_id)) {
            $this->page['template_id'] = $template_id;
        }

        $form = new S3\Form\UserInfoForm($this->custom_fields);
        $form->edit_mode    = S3\User::isLogged();
        $form->ver_id       = $this->ver_id;
        $form->userSettings = S3\User::getSettings();
        $form->execute();

        $shop2_id = S3\Shop2::getId();

        if (!$shop2_id) {
            return [];
        }

        $currency_id = S3\Shop2\Currency::getId($shop2_id);
        $currency = S3\Shop2\Currency::getById($shop2_id, $currency_id);

        $limit = 1000;
        $filter = [
            "user_id" => $this->user['user_id'],
            "archive" => 0
        ];

        $num_orders = S3\Shop2\Shop2Order::countOrders($shop2_id, $filter);
        $shop2_order = S3\Shop2\Shop2Order::getOrders($shop2_id, $filter, $p * $limit, $limit, true);
        $pages = (int)ceil($num_orders / $limit);

        $orders['orders'] = $shop2_order;
        $orders['pages'] = $pages;
        $orders['currency'] = $currency;
        S3::$renderer->assign_by_ref('orders', $orders);



        if ($form->done && !$form->error) {
            if ($form->soc_email) {
                $this->registrationEmail($form);
                throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=settings&edit=done&soc_email=done", 302);
            }

            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=settings&edit=done", 302);
        }
        return ['info_form' => $form];
    }

    /**
     * Смена пароля
     * @return array
     * @throws State\Redirect
     * @throws \ErrorException
     */
    public function changePasswordAction() {
        if (!S3\User::isLogged()) {
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=register", 302);
        }

        if ($template_id = S3\Template::getFitIdByName('user.change.password.tpl', $this->ver_id)) {
            $this->page['template_id'] = $template_id;
        }

        $form = new S3\Form\UserPasswordForm();
        $form->execute();

        if ($form->done && !$form->error) {
            $this->sendNewPassword($this->user['email']);
//			$this->user = S3\User::doLogin($form->getControlValue('user_id'));
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}", 302);
        }
        return ['password_form' => $form];
    }


   /**
     * Создание архива проекта
   
     */


    public function zipAction($order_id=null,$hash=null){


        $shop2_id = S3\Shop2::getId();

        $order=new S3\Shop2\Order($shop2_id,$order_id);
        $order_data=$order->toArray();


        if ($order->getHash() != $hash) {
            if (!$this->user || $order->user_id != $this->user['user_id']) {
                echo "Это не ваш проект,доступ запрещён. в случае ошибки обратитесь за помощью к администратору.";
                exit;
                return [];
            }
        }



        $order_previews_path=array();
        $order_source_path=array();

        foreach ($order_data["data_previews"] as $data_preview) {
            $data_preview=explode("/d/1327015/",$data_preview);
            $data_preview="/www/tilesset/public/d/1327015/".$data_preview[1];
            $order_previews_path[]=$data_preview;
        }

        foreach ($order_data["data"]["data_project"] as $canvas) {
            foreach ($canvas["objects"] as $data_object) {
                if ($data_object["type"] == "image") {
                    $data_object["src"] = explode("/d/1327015/", $data_object["src"]);
                    $data_object["src"] = "/www/tilesset/public/d/1327015/" . $data_object["src"][1];
                    $order_source_path[] = $data_object["src"];
                }
            }
        }

        $tmpfname = tempnam("/www/tilesset/public/d/1327015/tmp_zip/", "arhive_order_id_".$order_id);


        $path=$tmpfname.".zip";
        $zip = new \ZipArchive;
        $res = $zip->open($path, \ZipArchive::CREATE);
        if ($res === TRUE) {

            foreach ($order_previews_path as $item){
                $zip->addFile($item,"previews/".basename($item));
            }
            foreach ($order_source_path as $item){
                $zip->addFile($item,"source/".basename($item));
            }
            $zip->addFile("/www/tilesset/public/d/1327015/tmp_zip/readme.txt","readme.txt");
            $zip->close();





            if (file_exists($path)) {
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename="'.basename($path).'"');
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . filesize($path));
                readfile($path);

            }

            unlink($tmpfname);
            unlink($path);
            exit;

        } else {
            echo 'failed';
        }







    }

    /**
     * Письмо с новым паролем
     * @param null $email
     * @return array|bool
     */
    public function sendNewPassword($email = null) {
        if (!$email) {
            return[];
        }
        $user_info = S3\User::getByMail($email);
        if (!$user_info) {
            return false;
        }
        $user_info['site_domain'] = $_SERVER['HTTP_HOST'];
        S3::$renderer->assign_by_ref('_user_info', $user_info);
        $template_id = S3\Template::getLocalOrArcIdByName('user.send.new.password.tpl', $this->ver_id);
        if ($template_id and
            $tpl_resource = S3\Template::getResourceById($template_id) and
            $body = @S3::$renderer->fetch($tpl_resource)
        ) {
            $content_type = S3\Template::getContentTypeByResource($tpl_resource, $this->ver_id);
            $m = explode("[body]", $body);
        } else {
            $content_type = S3\Template::PLAIN_CONTENT_TYPE;
            $m[0] = l('USER_MAIL_CHANGED_PASSWORD') . ": " . $user_info['site_domain'] . "\n";
            $m[1] = l('USER_HELLO') . ", " . $user_info['name'] . "\n";
            $m[1] .= l('USER_MAIL_CHANGED_PASSWORD') . ": " . $user_info['site_domain'] . "\n";
            $m[1] .= l('USER_REQUESTED_ACCESS_LOGIN') . ": " . $user_info['email'] . "\n";
            $m[1] .= l('USER_PASSWORD_NEW') . ": " . $user_info['pwd'] . "\n";
        }
        $m[1] = htmlspecialchars_decode($m[1]);
        $admin_email = $this->user_settings['admin_email'];
        S3\Mail::send($email, $admin_email, $m[0], $m[1], "pwd_changed", $user_info['user_id'], $content_type, $admin_email);

        return true;
    }

    /**
     * Список заказов пользователя
     * @param int $p unsigned
     * @return array
     * @throws State\Redirect
     */
    public function ordersAction($p = null) {
        if (!S3\User::isLogged()) {
            throw State::redirect("{$this->site_protocol}://{$this->request->name}{$this->page['url']}?mode=register", 302);
        }

        $shop2_id = S3\Shop2::getId();

        if (!$shop2_id) {
            return [];
        }

        $currency_id = S3\Shop2\Currency::getId($shop2_id);
        $currency = S3\Shop2\Currency::getById($shop2_id, $currency_id);

        $limit = 50;
        $filter = [
            "user_id" => $this->user['user_id'],
            "archive" => 0
        ];

        $num_orders = S3\Shop2\Shop2Order::countOrders($shop2_id, $filter);
        $shop2_order = S3\Shop2\Shop2Order::getOrders($shop2_id, $filter, $p * $limit, $limit, true);
        $pages = (int)ceil($num_orders / $limit);

        $user['orders'] = $shop2_order;
        $user['pages'] = $pages;
        $user['currency'] = $currency;

        return $user;
    }

   
 

    /**
     * @param \S3\Form\UserRegisterForm $form
     * @throws \ErrorException
     */
    private function registrationMail(S3\Form\UserRegisterForm $form) {
        S3::$renderer->assign_by_ref('_user_info', $this->user);
        // Mail body
        $template_id = S3\Template::getLocalOrArcIdByName('user.mail.activate.tpl', $form->ver_id);

        if ($template_id and $tpl_resource = S3\Template::getResourceById($template_id) and
            $body = @S3::$renderer->fetch($tpl_resource)
        ) { // Mail body from template is OK?
            $content_type = S3\Template::getContentTypeByResource($tpl_resource, $form->ver_id);
            $m = explode("[body]", $body);
        } else { // Fetch default mail body
            $content_type = S3\Template::PLAIN_CONTENT_TYPE;

            $m[0] = l('USER_REGISTER') . " " . $this->user['site_domain'];
            $m[1] = l('USER_YOU_REGISTERED') . ": " . $this->user['site_domain'] . "\n";
            if (!empty($this->user['login'])) {
                $m[1] .=  l('USER_REQUESTED_ACCESS_LOGIN') . ": " . $this->user['login'] . "\n" . l('PASSWORD') . ": " . $this->user['pwd'] . "\n";
            } else {
                $m[1] .=  l('USER_REQUESTED_ACCESS_LOGIN') . ": " . $this->user['email'] . "\n" . l('PASSWORD') . ": " .  $this->user['pwd'] . "\n";
            }
            $m[1] .= l('USER_CONFIRM_REGISTRATION_LINK') . ": " . $this->user['activation_url'];
        }
        $email = $form->getControlValue('email');

        $m[1] = htmlspecialchars_decode($m[1]);
        $admin_email = S3\User::getSetting('admin_email');
        S3\Mail::send($email, $admin_email, $m[0], $m[1], 'activation', $this->user['user_id'], $content_type, $admin_email);
    }

  
}

