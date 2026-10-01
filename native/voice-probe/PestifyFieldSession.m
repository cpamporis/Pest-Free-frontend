#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <Speech/Speech.h>
#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <math.h>

// Opt-in Lab experiment. The audio engine remains active while locked, including
// wake waiting and read-back. Buffers are discarded whenever no request is active.
@interface PestifyFieldSession : RCTEventEmitter <RCTBridgeModule, AVSpeechSynthesizerDelegate>
@property(nonatomic, strong) AVAudioEngine *engine;
@property(nonatomic, strong) SFSpeechRecognizer *recognizer;
@property(nonatomic, strong) SFSpeechAudioBufferRecognitionRequest *audioRequest;
@property(nonatomic, strong) SFSpeechRecognitionTask *task;
@property(nonatomic, strong) AVSpeechSynthesizer *speaker;
@property(nonatomic, strong) NSTimer *captureTimer;
@property(nonatomic, strong) NSTimer *endpointTimer;
@property(nonatomic, strong) NSTimer *idleTimer;
@property(nonatomic, strong) NSTimer *watchdog;
@property(nonatomic, copy) NSString *sessionKey;
@property(nonatomic, copy) NSString *commandKey;
@property(nonatomic, copy) NSString *mode;
@property(nonatomic, copy) NSString *partial;
@property(nonatomic, copy) RCTPromiseResolveBlock replyResolve;
@property(nonatomic, assign) BOOL observes;
@property(nonatomic, assign) BOOL tapped;
@property(nonatomic, assign) BOOL heardSpeech;
@property(nonatomic, assign) BOOL ending;
@property(nonatomic, assign) BOOL acceptedReply;
@property(nonatomic, assign) BOOL wakePreviewEnabled;
@property(nonatomic, copy) NSArray<NSString *> *wakePhrases;
@property(nonatomic, copy) NSString *readyMessage;
@property(nonatomic, assign) NSTimeInterval idleSeconds;
@property(nonatomic, assign) NSTimeInterval silenceSeconds;
@property(nonatomic, assign) NSTimeInterval captureSeconds;
@property(nonatomic, assign) NSUInteger revision;
@property(nonatomic, assign) NSTimeInterval lastVoice;
@property(nonatomic, assign) NSTimeInterval lastText;
@property(nonatomic, assign) NSTimeInterval lastCommand;
@end
@implementation PestifyFieldSession
RCT_EXPORT_MODULE(PestifyFieldSession)
+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }
- (BOOL)isLab {
  return [[NSBundle mainBundle].bundleIdentifier isEqualToString:@"com.cpamporis.pestfree.dev"] &&
    [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"PestifyFieldSessionEnabled"] boolValue];
}
- (NSDictionary *)constantsToExport { return @{@"labEnabled": @([self isLab]), @"wakeVersion": @4, @"configurationVersion": @1}; }
- (NSArray<NSString *> *)supportedEvents { return @[@"PestifyFieldEvent"]; }
- (void)startObserving { self.observes = YES; }
- (void)stopObserving { self.observes = NO; [self shutdown:@"LISTENER_REMOVED"]; }
- (instancetype)init {
  if ((self = [super init])) {
    self.wakePhrases = @[@"Αλέρτ", @"Alert"];
    self.readyMessage = @"Έτοιμος";
    self.idleSeconds = 60; self.silenceSeconds = 1.4; self.captureSeconds = 20;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(hideWakePreview:)
      name:UIApplicationWillResignActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(interrupted:)
      name:AVAudioSessionInterruptionNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(routeChanged:)
      name:AVAudioSessionRouteChangeNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(mediaReset:)
      name:AVAudioSessionMediaServicesWereResetNotification object:nil];
  }
  return self;
}
- (void)emit:(NSString *)code extra:(NSDictionary *)extra {
  if (!self.observes) return;
  NSMutableDictionary *payload = [@{@"code":code, @"sessionId":self.sessionKey ?: @""} mutableCopy];
  if (extra) [payload addEntriesFromDictionary:extra];
  [self sendEventWithName:@"PestifyFieldEvent" body:payload];
}
// Explicit opt-in, visible Lab screen only; never persisted or sent to a server.
RCT_EXPORT_METHOD(configureWakePreview:(BOOL)enabled) {
  self.wakePreviewEnabled = enabled && [self isLab] &&
    [UIApplication sharedApplication].applicationState == UIApplicationStateActive;
}
- (void)hideWakePreview:(NSNotification *)note { self.wakePreviewEnabled = NO; }
- (void)previewWake:(NSString *)stage text:(NSString *)text {
  if (!self.wakePreviewEnabled || [UIApplication sharedApplication].applicationState != UIApplicationStateActive) return;
  NSString *bounded = text ?: @"";
  if (bounded.length > 160) bounded = [bounded substringToIndex:160];
  [self emit:@"WAKE_PREVIEW" extra:@{@"stage":stage, @"text":bounded}];
}
- (void)clearRecognition {
  self.revision++;
  [self.captureTimer invalidate]; self.captureTimer = nil;
  [self.endpointTimer invalidate]; self.endpointTimer = nil;
  @synchronized (self) {
    [self.audioRequest endAudio]; self.audioRequest = nil;
  }
  [self.task cancel]; self.task = nil; self.recognizer = nil;
  self.partial = nil; self.heardSpeech = NO; self.ending = NO;
}
- (void)shutdown:(NSString *)reason {
  if (!self.sessionKey && !self.engine) return;
  [self clearRecognition];
  [self.idleTimer invalidate]; self.idleTimer = nil;
  [self.watchdog invalidate]; self.watchdog = nil;
  RCTPromiseResolveBlock reply = self.replyResolve; self.replyResolve = nil;
  self.speaker.delegate = nil; [self.speaker stopSpeakingAtBoundary:AVSpeechBoundaryImmediate]; self.speaker = nil;
  [self.engine stop];
  if (self.tapped) { [self.engine.inputNode removeTapOnBus:0]; self.tapped = NO; }
  self.engine = nil; self.commandKey = nil; self.mode = @"stopped";
  [[AVAudioSession sharedInstance] setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:NULL];
  [self emit:@"STOPPED" extra:@{@"reason":reason}]; self.sessionKey = nil;
  if (reply) reply(@NO);
}
- (void)interrupted:(NSNotification *)note {
  if ([note.userInfo[AVAudioSessionInterruptionTypeKey] unsignedIntegerValue] == AVAudioSessionInterruptionTypeBegan)
    dispatch_async(dispatch_get_main_queue(), ^{ [self shutdown:@"AUDIO_INTERRUPTED"]; });
}
- (void)routeChanged:(NSNotification *)note {
  AVAudioSessionRouteChangeReason reason = [note.userInfo[AVAudioSessionRouteChangeReasonKey] unsignedIntegerValue];
  if (reason == AVAudioSessionRouteChangeReasonOldDeviceUnavailable || reason == AVAudioSessionRouteChangeReasonNewDeviceAvailable)
    dispatch_async(dispatch_get_main_queue(), ^{ [self shutdown:@"AUDIO_ROUTE_CHANGED"]; });
}
- (void)mediaReset:(NSNotification *)note { dispatch_async(dispatch_get_main_queue(), ^{ [self shutdown:@"AUDIO_RESET"]; }); }
- (BOOL)localeReady:(NSString *)locale {
  SFSpeechRecognizer *recognizer = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:locale]];
  return recognizer && recognizer.supportsOnDeviceRecognition && recognizer.available;
}
RCT_REMAP_METHOD(startField, fieldIdentifier:(NSString *)identifier resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (![self isLab] || [UIApplication sharedApplication].applicationState != UIApplicationStateActive || !self.observes || identifier.length == 0) {
    reject(@"FOREGROUND_REQUIRED", @"Start the Lab session from its visible screen", nil); return;
  }
  if (![self localeReady:@"el-GR"]) {
    reject(@"LOCAL_LANGUAGES_REQUIRED", @"Greek on-device recognition must be available", nil); return;
  }
  if ([SFSpeechRecognizer authorizationStatus] != SFSpeechRecognizerAuthorizationStatusAuthorized ||
      [AVAudioSession sharedInstance].recordPermission != AVAudioSessionRecordPermissionGranted) {
    reject(@"PERMISSION_REQUIRED", @"Speech and microphone permissions required", nil); return;
  }
  [self shutdown:@"RESTARTED"]; self.sessionKey = identifier;
  NSError *error = nil; AVAudioSession *audio = [AVAudioSession sharedInstance];
  if (![audio setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeMeasurement options:AVAudioSessionCategoryOptionDefaultToSpeaker error:&error] || ![audio setActive:YES error:&error]) {
    [self shutdown:@"AUDIO_UNAVAILABLE"]; reject(@"AUDIO_UNAVAILABLE", @"Audio unavailable", nil); return;
  }
  self.engine = [AVAudioEngine new];
  AVAudioInputNode *input = self.engine.inputNode; AVAudioFormat *format = [input outputFormatForBus:0];
  if (format.sampleRate <= 0 || format.channelCount == 0) {
    [self shutdown:@"MICROPHONE_UNAVAILABLE"]; reject(@"MICROPHONE_UNAVAILABLE", @"No input", nil); return;
  }
  __weak PestifyFieldSession *weakSelf = self;
  __block NSTimeInterval lastTick = 0;
  [input installTapOnBus:0 bufferSize:1024 format:format block:^(AVAudioPCMBuffer *buffer, AVAudioTime *when) {
    PestifyFieldSession *owner = weakSelf; if (!owner) return;
    @synchronized (owner) { if (owner.audioRequest) [owner.audioRequest appendAudioPCMBuffer:buffer]; }
    NSTimeInterval now = [NSProcessInfo processInfo].systemUptime;
    if (now-lastTick < 0.1) return; lastTick = now;
    float * const *channels = buffer.floatChannelData;
    if (!channels || buffer.frameLength == 0) return;
    double energy = 0;
    for (AVAudioFrameCount i=0;i<buffer.frameLength;i++) { double sample=channels[0][i]; energy+=sample*sample; }
    if (sqrt(energy/buffer.frameLength) > 0.01) dispatch_async(dispatch_get_main_queue(), ^{
      PestifyFieldSession *current = weakSelf;
      if (current.sessionKey) current.lastVoice = now;
    });
  }];
  self.tapped = YES; [self.engine prepare];
  if (![self.engine startAndReturnError:&error]) { [self shutdown:@"AUDIO_START_FAILED"]; reject(@"AUDIO_START_FAILED", @"No input", nil); return; }
  self.lastCommand = [NSProcessInfo processInfo].systemUptime;
  self.idleTimer = [NSTimer scheduledTimerWithTimeInterval:1 repeats:YES block:^(NSTimer *timer) {
    PestifyFieldSession *owner = weakSelf;
    if ([owner.mode isEqualToString:@"command"] && !owner.heardSpeech &&
        [NSProcessInfo processInfo].systemUptime-owner.lastVoice >= owner.silenceSeconds &&
        [NSProcessInfo processInfo].systemUptime-owner.lastCommand >= owner.idleSeconds)
      [owner beginRecognition:@"wake"];
  }];
  [self beginRecognition:@"wake"]; resolve(@YES);
}
- (NSString *)normalizedWakePhrase:(NSString *)text {
  NSString *lower = [[text stringByFoldingWithOptions:NSDiacriticInsensitiveSearch locale:[NSLocale localeWithLocaleIdentifier:@"el-GR"]] lowercaseString];
  NSArray *words = [lower componentsSeparatedByCharactersInSet:[[NSCharacterSet alphanumericCharacterSet] invertedSet]];
  NSMutableArray *tokens = [NSMutableArray array];
  for (NSString *word in words) if (word.length) [tokens addObject:word];
  return [tokens componentsJoinedByString:@" "];
}
- (BOOL)isWakePhrase:(NSString *)text {
  NSString *phrase = [self normalizedWakePhrase:text];
  // Complete final utterance only, never substring or partial recognition.
  for (NSString *allowed in self.wakePhrases)
    if ([phrase isEqualToString:[self normalizedWakePhrase:allowed]]) return YES;
  return NO;
}
- (BOOL)validSeconds:(id)value minimum:(double)minimum maximum:(double)maximum {
  return [value isKindOfClass:[NSNumber class]] && CFGetTypeID((__bridge CFTypeRef)value) != CFBooleanGetTypeID() &&
    isfinite([value doubleValue]) && [value doubleValue]>=minimum && [value doubleValue]<=maximum;
}
RCT_REMAP_METHOD(configureField, configuration:(NSDictionary *)configuration resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (![self isLab] || self.sessionKey || [UIApplication sharedApplication].applicationState != UIApplicationStateActive) {
    reject(@"CONFIGURATION_IDLE_REQUIRED", @"Configure from the visible Lab before starting a session", nil); return;
  }
  if (![configuration isKindOfClass:[NSDictionary class]]) {
    reject(@"INVALID_CONFIGURATION", @"Configuration must be a dictionary", nil); return;
  }
  NSSet *keys=[NSSet setWithArray:@[@"wakePhrases",@"readyMessage",@"idleSeconds",@"silenceSeconds",@"captureSeconds"]];
  BOOL valid=configuration.count==keys.count;
  for(id key in configuration) if(![keys containsObject:key])valid=NO;
  id phrases=configuration[@"wakePhrases"], message=configuration[@"readyMessage"];
  valid=valid && [phrases isKindOfClass:[NSArray class]] && [phrases count]>=1 && [phrases count]<=8;
  if(valid)for(id phrase in phrases) {
    if(![phrase isKindOfClass:[NSString class]] || [phrase length]>80 || [self normalizedWakePhrase:phrase].length==0) {valid=NO;break;}
  }
  valid=valid && [message isKindOfClass:[NSString class]] && [message length]<=160 &&
    [[message stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]] length]>0 &&
    [self validSeconds:configuration[@"idleSeconds"] minimum:15 maximum:300] &&
    [self validSeconds:configuration[@"silenceSeconds"] minimum:0.7 maximum:3] &&
    [self validSeconds:configuration[@"captureSeconds"] minimum:5 maximum:45];
  if(!valid) {reject(@"INVALID_CONFIGURATION", @"Invalid field configuration; previous configuration retained",nil);return;}
  // Atomic replacement only after every field passes validation. Values are fixed for the session.
  self.wakePhrases=[phrases copy]; self.readyMessage=[message copy];
  self.idleSeconds=[configuration[@"idleSeconds"] doubleValue];
  self.silenceSeconds=[configuration[@"silenceSeconds"] doubleValue];
  self.captureSeconds=[configuration[@"captureSeconds"] doubleValue];
  resolve(@YES);
}
- (void)beginRecognition:(NSString *)mode {
  if (!self.sessionKey) return;
  [self clearRecognition]; self.mode = mode; self.commandKey = nil;
  NSString *locale = @"el-GR"; // Same on-device language as the technician's commands.
  if (![self localeReady:locale]) { [self shutdown:@"LOCAL_RECOGNIZER_UNAVAILABLE"]; return; }
  self.recognizer = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:locale]];
  SFSpeechAudioBufferRecognitionRequest *request = [SFSpeechAudioBufferRecognitionRequest new];
  request.requiresOnDeviceRecognition = YES; request.shouldReportPartialResults = YES;
  request.taskHint = SFSpeechRecognitionTaskHintConfirmation;
  if ([mode isEqualToString:@"wake"]) request.contextualStrings = self.wakePhrases;
  @synchronized (self) { self.audioRequest = request; }
  self.lastText = self.lastVoice = [NSProcessInfo processInfo].systemUptime;
  NSUInteger revision = self.revision; __weak PestifyFieldSession *weakSelf = self;
  self.task = [self.recognizer recognitionTaskWithRequest:request resultHandler:^(SFSpeechRecognitionResult *result, NSError *error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      PestifyFieldSession *owner = weakSelf;
      if (!owner.sessionKey || owner.revision != revision) return;
      NSString *text = result.bestTranscription.formattedString ?: @"";
      if (text.length) {
        owner.heardSpeech = YES;
        if (![text isEqualToString:owner.partial]) { owner.partial = text; owner.lastText = [NSProcessInfo processInfo].systemUptime;
          if ([mode isEqualToString:@"wake"]) [owner previewWake:@"partial" text:text]; }
      }
      if (result.isFinal) { [owner finalText:text mode:mode]; }
      else if (error) [owner shutdown:@"RECOGNITION_FAILED"];
    });
  }];
  self.captureTimer = [NSTimer scheduledTimerWithTimeInterval:self.captureSeconds repeats:NO block:^(NSTimer *timer) {
    PestifyFieldSession *owner = weakSelf;
    if (owner.sessionKey && owner.revision == revision) {
      if ([mode isEqualToString:@"wake"]) [owner previewWake:owner.heardSpeech ? @"capture_timeout" : @"no_text" text:owner.partial];
      [owner beginRecognition:mode]; // discard unfinished speech
    }
  }];
  self.endpointTimer = [NSTimer scheduledTimerWithTimeInterval:0.15 repeats:YES block:^(NSTimer *timer) {
    PestifyFieldSession *owner = weakSelf;
    if (!owner.sessionKey || owner.revision != revision || !owner.heardSpeech || owner.ending) return;
    if ([NSProcessInfo processInfo].systemUptime-MAX(owner.lastText,owner.lastVoice) >= owner.silenceSeconds) {
      owner.ending = YES; [owner.endpointTimer invalidate]; owner.endpointTimer=nil;
      [owner.captureTimer invalidate];
      @synchronized (owner) { [owner.audioRequest endAudio]; owner.audioRequest=nil; }
      owner.captureTimer = [NSTimer scheduledTimerWithTimeInterval:3 repeats:NO block:^(NSTimer *deadline) {
        if (weakSelf.sessionKey && weakSelf.revision == revision) {
          if ([mode isEqualToString:@"wake"]) [weakSelf previewWake:@"final_timeout" text:weakSelf.partial];
          [weakSelf beginRecognition:mode];
        }
      }];
    }
  }];
  [self emit:[mode isEqualToString:@"wake"] ? @"WAITING_WAKE" : @"LISTENING" extra:nil];
}
- (void)finalText:(NSString *)text mode:(NSString *)mode {
  [self clearRecognition];
  if ([mode isEqualToString:@"wake"]) {
    BOOL accepted = [self isWakePhrase:text];
    [self previewWake:accepted ? @"accepted" : @"rejected" text:text];
    if (accepted) {
      self.lastCommand = [NSProcessInfo processInfo].systemUptime;
      self.mode = @"ready"; [self say:self.readyMessage];
    } else [self beginRecognition:@"wake"];
    return;
  }
  self.mode = @"processing"; self.commandKey = [[NSUUID UUID] UUIDString];
  [self emit:@"COMMAND" extra:@{@"commandId":self.commandKey, @"text":text}];
  __weak PestifyFieldSession *weakSelf = self;
  self.watchdog = [NSTimer scheduledTimerWithTimeInterval:10 repeats:NO block:^(NSTimer *timer) { [weakSelf shutdown:@"APP_RESPONSE_TIMEOUT"]; }];
}
- (void)say:(NSString *)text {
  [self clearRecognition]; // engine stays active; buffers are discarded during TTS
  AVSpeechSynthesisVoice *voice = [AVSpeechSynthesisVoice voiceWithLanguage:@"el-GR"];
  if (!voice) { [self shutdown:@"GREEK_VOICE_UNAVAILABLE"]; return; }
  self.speaker = [AVSpeechSynthesizer new]; self.speaker.delegate = self;
  AVSpeechUtterance *utterance = [[AVSpeechUtterance alloc] initWithString:text]; utterance.voice=voice;
  [self.speaker speakUtterance:utterance];
  [self.watchdog invalidate]; __weak PestifyFieldSession *weakSelf=self;
  self.watchdog=[NSTimer scheduledTimerWithTimeInterval:30 repeats:NO block:^(NSTimer *timer){ [weakSelf shutdown:@"SPEECH_TIMEOUT"]; }];
}
RCT_REMAP_METHOD(reply, replyIdentifier:(NSString *)identifier text:(NSString *)text accepted:(BOOL)accepted resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.sessionKey || ![self.commandKey isEqualToString:identifier] || ![self.mode isEqualToString:@"processing"] || text.length==0 || text.length>1000) {
    resolve(@NO); return;
  }
  self.acceptedReply=accepted; self.replyResolve=resolve; self.mode=@"reply"; [self say:text];
}
- (void)resumeAfterSound {
  __weak PestifyFieldSession *weakSelf=self; NSString *key=self.sessionKey;
  [self.watchdog invalidate];
  self.watchdog=[NSTimer scheduledTimerWithTimeInterval:0.25 repeats:NO block:^(NSTimer *timer){
    if ([weakSelf.sessionKey isEqualToString:key]) [weakSelf beginRecognition:@"command"];
  }];
}
- (void)speechSynthesizer:(AVSpeechSynthesizer *)speaker didFinishSpeechUtterance:(AVSpeechUtterance *)utterance {
  if (speaker != self.speaker || !self.sessionKey) return;
  self.speaker.delegate=nil; self.speaker=nil; [self.watchdog invalidate];self.watchdog=nil;
  if ([self.mode isEqualToString:@"ready"]) { [self resumeAfterSound]; return; }
  self.mode=@"awaitingCommit";
  RCTPromiseResolveBlock resolve=self.replyResolve;self.replyResolve=nil;if(resolve)resolve(@YES);
  __weak PestifyFieldSession *weakSelf=self;
  self.watchdog=[NSTimer scheduledTimerWithTimeInterval:10 repeats:NO block:^(NSTimer *timer){[weakSelf shutdown:@"COMMIT_TIMEOUT"];}];
}
- (void)speechSynthesizer:(AVSpeechSynthesizer *)speaker didCancelSpeechUtterance:(AVSpeechUtterance *)utterance {
  if (speaker==self.speaker) [self shutdown:@"SPEECH_INTERRUPTED"];
}
RCT_EXPORT_METHOD(continueAfterCommit:(NSString *)identifier) {
  if (!self.sessionKey || ![self.commandKey isEqualToString:identifier] || ![self.mode isEqualToString:@"awaitingCommit"]) return;
  if (self.acceptedReply) self.lastCommand=[NSProcessInfo processInfo].systemUptime;
  self.commandKey=nil;[self resumeAfterSound];
}
RCT_EXPORT_METHOD(waitForWake) {
  if (self.sessionKey && [self.mode isEqualToString:@"processing"]) { [self.watchdog invalidate];self.watchdog=nil;[self beginRecognition:@"wake"]; }
}
RCT_EXPORT_METHOD(stopField) { [self shutdown:@"USER_STOPPED"]; }
- (void)invalidate {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  if ([NSThread isMainThread]) [self shutdown:@"INVALIDATED"];
  else dispatch_async(dispatch_get_main_queue(), ^{[self shutdown:@"INVALIDATED"];});
  [super invalidate];
}
@end
