
from django.urls import path

from . import views

app_name = 'network'

urlpatterns = [
    path("", views.index, name="index"),
    path("index", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    
	# API Routes
    path("allPosts", views.allPosts, name="allPosts"),
    path("followedPeoplePosts", views.followedPeoplePosts, name="followedPeoplePosts"),
    path("posterPosts/<str:username>", views.posterPosts, name="posterPosts"),
    path("newPost", views.newPost, name="newPost"),
    path("like/<int:post_id>", views.likeUnlike, name = "likeUnlike"),
    path("follow/<str:username>", views.followUnfollow, name="folllowUnfollow"),
    path("updatePost", views.updatePost, name = "updatePost"),
    path("userSpace/<str:username>", views.userSpace, name="userSpace"),
    path("userInfo", views.userInfo, name="userInfo"),
]
