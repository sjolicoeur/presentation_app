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


###
# Make filepaths relative to settings.
path = lambda root,*a: os.path.join(root, *a)
ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_ROOT = path(ROOT, 'templates')
STATIC_ROOT = path(ROOT, 'static')

class MainHandler(tornado.web.RequestHandler):
    #def prepare(self):

    def get(self):
        #self.write("Hello, world")
        # put this in the pre
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        presentations = []
        data = []
        keys = r.keys("pres_*")

        if keys :
            data = r.mget(keys)
        listing = [(x[0], ast.literal_eval(x[1])) for x in zip(keys,data) ]
        self.render("home.html", listing=listing)

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
        #self.write("{} - {}".format( self.get_argument("name"), self.get_argument("password", None)))
        self.render("partial_presentation_listing.html", name=name, slug=slug)

class NameHandler(tornado.web.RequestHandler):
    def get(self, name,):
        self.write("Hello, {}".format(name))

class PresentationHandler(tornado.web.RequestHandler):
    def prepare(self):
        print "this is the controller "
        print dir(self.request), "\n=======", self.request.host
    def get(self, name,):
        #if not entry: raise tornado.web.HTTPError(404)
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        presentation = r.get(name)
        print "name : ", name, "presentation : ", presentation
        if presentation :

            self.render("presentation.html", host=self.request.host, slug=name, presentation=presentation)
        #else :
        #    raise tornado.web.HTTPError(404)


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
        # self.set_secure_cookie("username", str(...))
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
        print "opened on ", presentation
        ChatSocketHandler.waiters.add(self)
        cookie = self.get_secure_cookie("username")
        print "cookie is : " , cookie, bool(cookie), self
        if cookie :
            self.write_message("Welcome back {}!".format(cookie))
        else :
            self.write_message("You are unregistered please fill out <input type=\"text\" placeholder=\"{}\"/>".format(str(self) ) )

    def on_close(self):
        print "closed on "
        ChatSocketHandler.waiters.remove(self)

    @classmethod
    def update_cache(cls, chat):
        cls.cache.append(chat)
        if len(cls.cache) > cls.cache_size:
            cls.cache = cls.cache[-cls.cache_size:]

    @classmethod
    def send_updates(cls, chat):
        #logging.info("sending message to %d waiters", len(cls.waiters))
        print "sending message to {} waiters".format(len(cls.waiters))
        for waiter in cls.waiters:
            #print dir(waiter), " :: waiter func and attr"
            # only send to waiters that have the proper path
            print "this waiter's path : ", waiter.request.path
            try:
                waiter.write_message(chat)
            except:
                #logging.error("Error sending message", exc_info=True)
                print "error sending message"

    def on_message(self, message):
        # cgi.urlparse.parse_qs("a=3&a=2")
        #logging.info("got message %r", message)
        print "message", message, dir(self),dir(self.request)
        message = "--- {0} ---- {0} ---".format(message)
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
        #(r"/(\w+)/admin"),
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