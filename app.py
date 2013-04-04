import tornado.ioloop
import tornado.web
import os
import redis
import ast
####
import os.path
import re
import tornado.auth
# import tornado.database
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import unicodedata
import tornado.websocket
import json
import hashlib, uuid
from tornado.escape import json_encode
from tornado.template import Loader

###
# Make filepaths relative to settings.
path = lambda root,*a: os.path.join(root, *a)
ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_ROOT = path(ROOT, 'templates')
STATIC_ROOT = path(ROOT, 'static')
# coded while listening to Bonobo

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        presentations = []
        data = []
        keys = r.keys("pres_*")
        host = self.request.host

        if keys :
            data = r.mget(keys)
        listing = [(x[0], ast.literal_eval(x[1])) for x in zip(keys,data) ]
        rooms = [
            {
                "url" : "http://{}/{}".format(host, room[1]['slug']),
                "ws-url" : "ws://{}/{}/ws".format(host, room[1]['slug']),
                "name" : "{}".format(room[1]['name'])
            } for room in listing
        ]
        #######
        print self.request.headers
        if self.request.headers.get('Content-Type', None) == "application/json" :
            self.set_header("Content-Type", "application/json") 
            self.write(json_encode(rooms))
        else : 

            self.render("home.html", listing=listing, rooms=rooms)

    def post(self):
        # put this in the pre
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        ############
        name = self.get_argument("name")
        slug = "pres_{}".format(name.replace(" ","-"))
        password = self.get_argument("password", None)
        if not r.get(slug) :
            r.set(slug, {"name" : name, "password" : password, "participants" : [], "slug" : slug })
        ###
        print self.get_argument("name")
        print self.get_argument("password", None)
        self.render("partial_presentation_listing.html", name=name, slug=slug, host=self.request.host)

class NameHandler(tornado.web.RequestHandler):
    def get(self, name,):
        self.write("Hello, {}".format(name))

class PresentationHandler(tornado.web.RequestHandler):
    def prepare(self):
        print "this is the controller "
        print dir(self.request), "\n=======", self.request.host

    def get(self, name,):
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        presentation = r.get(name)
        # print "name : ", name, "presentation : ", presentation
        if presentation :
            self.render("presentation.html", host=self.request.host, slug=name, presentation=presentation)
        else :
           raise tornado.web.HTTPError(404)

class PresentationHUDHandler(tornado.web.RequestHandler):
    def prepare(self):
        print "this is the controller "
        print dir(self.request), "\n=======", self.request.host

    def get(self, name,):
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        presentation = r.get(name)
        # print "name : ", name, "presentation : ", presentation
        if presentation :
            self.render("presentation_HUD.html", host=self.request.host, slug=name, presentation=presentation)
        else :
           raise tornado.web.HTTPError(404)

####
####

class PresentationAdminHandler(tornado.web.RequestHandler):
    def prepare(self):
        print "this is the controller "
        print dir(self.request), "\n=======", self.request.host

    def get(self, name,):
        #if not entry: raise tornado.web.HTTPError(404)
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        presentation = r.get(name)
        print "name : ", name, "presentation : ", presentation
        if presentation :
            dummy_poll = {
                "qid" : 1234 ,  
                "question" : "what species are you?", 
                "answers" : [
                    {"aid" : 2, "answer" : "reptile"}, 
                    {"aid" : 22, "answer" : "lemur"}, 
                    {"aid" : 24, "answer" : "coder"},   ] }
            self.loader = Loader(os.path.join(os.path.dirname(__file__), "templates"))
            tmpl = self.loader.load("partial_poll.html")

            rendered_dummy_poll = tmpl.generate(poll = dummy_poll)
            self.render("presentation_admin.html", host=self.request.host, slug=name, presentation=presentation, poll=rendered_dummy_poll)
        


class CheckinHandler(tornado.web.RequestHandler):
    def get(self, name,):
        cookie = self.get_secure_cookie("username")
        print "cookie is : " , cookie, bool(cookie)
        # self.set_secure_cookie("username", str(...))
        self.render("checkin.html", checked_in = bool(cookie))

class AdminHandler(tornado.web.RequestHandler):
    def get(self):
        cookie = self.get_secure_cookie("username")
        print "cookie is : " , cookie, bool(cookie)
        self.render("admin.html", checked_in = bool(cookie))

class ChatSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()
    cache = []
    cache_size = 200

    def allow_draft76(self, presentation):
        print "allow_draft76", presentation
        # for iOS 5.0 Safari
        return True

    def open(self, presentation):
        # print "opened on ", presentation
        ChatSocketHandler.waiters.add(self)
        cookie = self.get_secure_cookie("username")
        #self.write_message("Welcome back {}!".format(cookie))
        welcom_message = {"type" : "chat" , "message" : "Welcome to room : {}".format(presentation), "username" : "SYSTEM"}
        #self.set_header("Content-Type", "application/json") 
        self.write_message(json_encode(welcom_message))
        
    def on_close(self):
        # print "closed on "
        ChatSocketHandler.waiters.remove(self)

    @classmethod
    def update_cache(cls, chat):
        cls.cache.append(chat)
        if len(cls.cache) > cls.cache_size:
            cls.cache = cls.cache[-cls.cache_size:]

    @classmethod
    def send_updates(cls, chat):
        #logging.info("sending message to %d waiters", len(cls.waiters))
        for waiter in cls.waiters:
            # only send to waiters that have the proper path
            try:
                waiter.write_message(chat)
                # inpect chat message  
            except:
                #logging.error("Error sending message", exc_info=True)
                print "error sending message"

    def extract_slug(self, url):
        import re 
        found_slug = re.match(r".+/film/([\w|-|_]+)/?$", url)
        if found_slug:
            print found_slug.groups(), " returning :=>", found_slug.group(1)
            return found_slug.group(1)
        print "slug not found for ", url
        return None

    def get_info_from_nfb_api(self, slug):
        import requests
        print "slug :::", slug
        url ="http://beta.nfb.ca/api/v2/json/film/get_info/{}/?api_key=beta".format(slug)
        headers = {'content-type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'}
        r = requests.get(url,  headers=headers)
        print "getting url : ", url 
        print r
        result_json = r.json()
        title = result_json["data"]["film"]["title"]
        mobile_url = result_json["data"]["film"]["mobile_url"]
        description = result_json["data"]["film"]["description"]
        director = result_json["data"]["film"]["director"]
        return {
            "title" : title,
            "url" : mobile_url,
            "description" : description,
            "director" : director
        }

    def on_message(self, message):
        parsed = tornado.escape.json_decode(message)
        print "decoded message :: ", parsed
        if parsed['type'] == "chat" :
            ChatSocketHandler.update_cache(message)
            ChatSocketHandler.send_updates(message)
        if parsed['type'] == "init_film" :
            slug = self.extract_slug(parsed["film_url"])
            print "extracted slug is ::: ", slug
            if slug :
                extra_info = self.get_info_from_nfb_api(slug)
                message = {"type" : "film" , "start" : 0 , "film_url" : parsed["film_url"]}
                message.update(extra_info)
                print "sending :::", message
                ChatSocketHandler.update_cache(message)
                ChatSocketHandler.send_updates(message)
        else :
            message = "--- {0} ---- {0} ---".format(message)
            # inpect chat message  
            # choose what to do with it 
            # parsed = tornado.escape.json_decode(message)
            # chat = {
            #     "id": str(uuid.uuid4()),
            #     "body": parsed["body"],
            #     }
            # chat["html"] = self.render_string("message.html", message=chat)

            # ChatSocketHandler.update_cache(chat)
            # ChatSocketHandler.send_updates(chat)
            ChatSocketHandler.update_cache(message)
            ChatSocketHandler.send_updates(message)


# ajax returns {"target" : ..., "data" : ..., "type" : ...}
settings = {
    "static_path": STATIC_ROOT,
    "template_loader" : tornado.template.Loader(TEMPLATE_ROOT),
    "cookie_secret": "__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
    #"login_url": "/login",
    #"xsrf_cookies": True,
    "debug":True
}

if __name__ == "__main__":
    application = tornado.web.Application([

        (r"/(\w+)", PresentationHandler),
        (r"/(\w+)/admin", PresentationAdminHandler),
        (r"/(\w+)/hud",PresentationHUDHandler),
        #(r"/(\w+)/admin/setup"),
        (r"/(\w+)/ws", ChatSocketHandler),
        (r"/(\w+)/checkin", CheckinHandler),
        (r"/admin/?", AdminHandler),
        #(r""),
        #(r""),
        (r"/static/(.*)", tornado.web.StaticFileHandler),
        (r"/", MainHandler),
    ], **settings)
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()