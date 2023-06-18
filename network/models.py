from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import datetime, time, date, timedelta, timezone

class User(AbstractUser):
    pass

class Post(models.Model):
	poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="poster")
	post = models.CharField(max_length=256)
	timestamp = models.DateTimeField(auto_now_add=True)
	
	def toJSON(self):
		return{
			"id": self.id,
			"user": self.poster.username,
			"content": self.post,
			"when": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
		}

class Like(models.Model):
	post = models.ForeignKey(Post, on_delete = models.CASCADE, related_name="likedPost")
	liker = models.ForeignKey(User, on_delete = models.CASCADE, related_name="liker")

class Follow(models.Model):
	follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follower")
	personOfAttention = models.ForeignKey(User, on_delete=models.CASCADE, related_name="personOfAttention") # aka: the followed-one.


