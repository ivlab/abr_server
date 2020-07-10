from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def compose(request):
    return render(request, 'abr_server.html')