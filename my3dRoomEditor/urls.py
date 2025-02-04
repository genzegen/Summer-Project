from django.contrib import admin
from django.urls import path
from myapp.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', intro, name='intro'),
    path('about', about, name='about'),
    path('getStarted', getStarted, name='getStarted'),
    path('mainpage', mainpage, name='mainpage'),
    path('home/', home, name='home'),
    path("my-projects/", my_projects, name="my-projects"),
    path("templates/", templates, name="templates"),
    path("community/", community, name="community"),
    path("settings/", settings, name="settings"),
    path("createpage", createpage, name="createpage"),
]
