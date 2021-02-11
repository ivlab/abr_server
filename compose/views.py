from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def compose(request):
    return render(request, 'compose.html')

def raw_state(request):
    return render(request, 'raw_editor.html')