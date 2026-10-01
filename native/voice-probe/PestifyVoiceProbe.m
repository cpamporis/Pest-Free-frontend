#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AVFoundation/AVFoundation.h>
#import <Speech/Speech.h>
#import <UIKit/UIKit.h>

// Bounded foreground-only on-device recognition and read-back. Never writes files.
@interface PestifyVoiceProbe : RCTEventEmitter <RCTBridgeModule, AVSpeechSynthesizerDelegate>
@property(nonatomic, copy) NSString *captureRequestTag;
@property(nonatomic, strong) AVSpeechSynthesizer *synthesizer;
@property(nonatomic, copy) RCTPromiseResolveBlock speechResolve;
@property(nonatomic, strong) AVAudioEngine *engine;
@property(nonatomic, strong) SFSpeechRecognizer *recognizer;
@property(nonatomic, strong) SFSpeechAudioBufferRecognitionRequest *request;
@property(nonatomic, strong) SFSpeechRecognitionTask *task;
@property(nonatomic, strong) NSTimer *deadline;
@property(nonatomic, assign) BOOL tapped;
@property(nonatomic, assign) BOOL listening;
@property(nonatomic, assign) NSUInteger generation;
@end

@implementation PestifyVoiceProbe
RCT_EXPORT_MODULE(PestifyVoiceProbe)
+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }
- (NSArray<NSString *> *)supportedEvents { return @[@"PestifyVoiceProbeResult"]; }
- (BOOL)isLab {
  return [[NSBundle mainBundle].bundleIdentifier isEqualToString:@"com.cpamporis.pestfree.dev"] &&
    [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"PestifyVoiceLabProbeEnabled"] boolValue];
}
- (instancetype)init {
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(backgrounded:)
      name:UIApplicationDidEnterBackgroundNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(interrupted:)
      name:AVAudioSessionInterruptionNotification object:nil];
  }
  return self;
}
- (NSDictionary *)constantsToExport { return @{@"labEnabled": @([self isLab]), @"phase": @2}; }
- (void)startObserving { self.listening = YES; }
- (void)stopObserving { self.listening = NO; [self cleanup]; }
- (void)cleanup {
  RCTPromiseResolveBlock completion = self.speechResolve; self.speechResolve = nil;
  self.synthesizer.delegate = nil;
  [self.synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate]; self.synthesizer = nil;
  if (completion) completion(@NO);
  self.generation++;
  [self.deadline invalidate]; self.deadline = nil;
  [self.engine stop];
  if (self.tapped) { [self.engine.inputNode removeTapOnBus:0]; self.tapped = NO; }
  [self.request endAudio];
  [self.task cancel]; self.task = nil;
  self.request = nil; self.recognizer = nil; self.engine = nil;
  [[AVAudioSession sharedInstance] setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:NULL];
}
- (void)finish:(NSDictionary *)result {
  NSMutableDictionary *payload = [result mutableCopy];
  if (self.captureRequestTag) payload[@"requestTag"] = self.captureRequestTag;
  [self cleanup];
  if (self.listening) [self sendEventWithName:@"PestifyVoiceProbeResult" body:payload];
}
// Keep the exported selector distinct from the backing property setter.
RCT_EXPORT_METHOD(setRequestTag:(NSString *)tag) { self.captureRequestTag = [tag copy]; }
- (void)backgrounded:(NSNotification *)notification {
  if (self.engine || self.synthesizer) [self finish:@{@"code": @"BACKGROUND_STOPPED"}];
}
- (void)interrupted:(NSNotification *)notification {
  if ([notification.userInfo[AVAudioSessionInterruptionTypeKey] unsignedIntegerValue] == AVAudioSessionInterruptionTypeBegan && (self.engine || self.synthesizer))
    [self finish:@{@"code": @"AUDIO_INTERRUPTED"}];
}
- (NSDictionary *)capabilities {
  SFSpeechRecognizer *speech = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:@"el-GR"]];
  return @{@"labEnabled": @([self isLab]), @"locale": @"el-GR",
    @"onDevice": @(speech != nil && speech.supportsOnDeviceRecognition),
    @"available": @(speech != nil && speech.available),
    @"speechAuthorized": @([SFSpeechRecognizer authorizationStatus] == SFSpeechRecognizerAuthorizationStatusAuthorized),
    @"microphoneAuthorized": @([AVAudioSession sharedInstance].recordPermission == AVAudioSessionRecordPermissionGranted)};
}
RCT_REMAP_METHOD(getCapabilities, capabilitiesResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  resolve([self capabilities]);
}
RCT_REMAP_METHOD(requestPermissions, permissionResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (![self isLab]) { reject(@"LAB_ONLY", @"Lab build required", nil); return; }
  [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (status != SFSpeechRecognizerAuthorizationStatusAuthorized) { resolve([self capabilities]); return; }
      [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
        dispatch_async(dispatch_get_main_queue(), ^{ resolve([self capabilities]); });
      }];
    });
  }];
}
RCT_REMAP_METHOD(start, startResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (![self isLab]) { reject(@"LAB_ONLY", @"Lab build required", nil); return; }
  if ([UIApplication sharedApplication].applicationState != UIApplicationStateActive) {
    reject(@"FOREGROUND_REQUIRED", @"Open the diagnostic screen", nil); return;
  }
  NSDictionary *caps = [self capabilities];
  if (![caps[@"onDevice"] boolValue]) { reject(@"GREEK_ON_DEVICE_UNAVAILABLE", @"Greek on-device recognition is unavailable", nil); return; }
  if (![caps[@"available"] boolValue]) { reject(@"RECOGNIZER_UNAVAILABLE", @"Recognizer unavailable", nil); return; }
  if (![caps[@"speechAuthorized"] boolValue] || ![caps[@"microphoneAuthorized"] boolValue]) {
    reject(@"PERMISSION_REQUIRED", @"Explicit permissions required", nil); return;
  }
  [self cleanup];
  self.engine = [AVAudioEngine new];
  self.recognizer = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale localeWithLocaleIdentifier:@"el-GR"]];
  self.request = [SFSpeechAudioBufferRecognitionRequest new];
  self.request.requiresOnDeviceRecognition = YES;
  self.request.shouldReportPartialResults = NO;
  self.request.taskHint = SFSpeechRecognitionTaskHintConfirmation;
  NSError *error = nil;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  if (![session setCategory:AVAudioSessionCategoryRecord mode:AVAudioSessionModeMeasurement options:0 error:&error] ||
      ![session setActive:YES error:&error]) {
    [self cleanup]; reject(@"AUDIO_SESSION_FAILED", @"Audio session unavailable", nil); return;
  }
  AVAudioInputNode *input = self.engine.inputNode;
  AVAudioFormat *format = [input outputFormatForBus:0];
  if (format.sampleRate <= 0 || format.channelCount == 0) {
    [self cleanup]; reject(@"MICROPHONE_UNAVAILABLE", @"No microphone input", nil); return;
  }
  // Capture the request, not mutable self, on the audio realtime callback.
  SFSpeechAudioBufferRecognitionRequest *request = self.request;
  [input installTapOnBus:0 bufferSize:1024 format:format block:^(AVAudioPCMBuffer *buffer, AVAudioTime *when) {
    [request appendAudioPCMBuffer:buffer];
  }];
  self.tapped = YES;
  NSUInteger generation = self.generation;
  __weak PestifyVoiceProbe *weakSelf = self;
  self.task = [self.recognizer recognitionTaskWithRequest:self.request resultHandler:^(SFSpeechRecognitionResult *result, NSError *recognitionError) {
    dispatch_async(dispatch_get_main_queue(), ^{
      PestifyVoiceProbe *owner = weakSelf;
      if (!owner || owner.generation != generation) return;
      if (result.isFinal) {
        // Transient transport to the parser only. No logging or persistent transcript.
        [owner finish:@{@"code": @"RESULT", @"text": result.bestTranscription.formattedString ?: @""}];
      } else if (recognitionError) [owner finish:@{@"code": @"RECOGNITION_FAILED"}];
    });
  }];
  [self.engine prepare];
  if (![self.engine startAndReturnError:&error]) {
    [self cleanup]; reject(@"AUDIO_START_FAILED", @"Microphone could not start", nil); return;
  }
  self.deadline = [NSTimer scheduledTimerWithTimeInterval:20 repeats:NO block:^(NSTimer *timer) {
    PestifyVoiceProbe *owner = weakSelf;
    if (owner && owner.generation == generation) [owner endCapture];
  }];
  resolve(@{@"recording": @YES, @"maxSeconds": @20});
}
- (void)endCapture {
  if (!self.engine || !self.task) return;
  [self.deadline invalidate];
  [self.engine stop];
  if (self.tapped) { [self.engine.inputNode removeTapOnBus:0]; self.tapped = NO; }
  [self.request endAudio];
  NSUInteger generation = self.generation;
  __weak PestifyVoiceProbe *weakSelf = self;
  self.deadline = [NSTimer scheduledTimerWithTimeInterval:3 repeats:NO block:^(NSTimer *timer) {
    PestifyVoiceProbe *owner = weakSelf;
    if (owner && owner.generation == generation) [owner finish:@{@"code": @"NO_FINAL_RESULT"}];
  }];
}
// Phase 2: read-back finishes before the microphone can restart.
RCT_REMAP_METHOD(speak, speakText:(NSString *)text resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (![self isLab] || [UIApplication sharedApplication].applicationState != UIApplicationStateActive || text.length == 0 || text.length > 1200) {
    reject(@"SPEECH_UNAVAILABLE", @"Open the Lab voice screen", nil); return;
  }
  [self cleanup];
  NSError *error = nil;
  AVAudioSession *audio = [AVAudioSession sharedInstance];
  AVSpeechSynthesisVoice *voice = [AVSpeechSynthesisVoice voiceWithLanguage:@"el-GR"];
  if (!voice || ![audio setCategory:AVAudioSessionCategoryPlayback mode:AVAudioSessionModeSpokenAudio options:0 error:&error] || ![audio setActive:YES error:&error]) {
    [self cleanup]; reject(@"SPEECH_UNAVAILABLE", @"Greek playback unavailable", nil); return;
  }
  self.speechResolve = resolve;
  self.synthesizer = [AVSpeechSynthesizer new]; self.synthesizer.delegate = self;
  AVSpeechUtterance *utterance = [[AVSpeechUtterance alloc] initWithString:text];
  utterance.voice = voice;
  [self.synthesizer speakUtterance:utterance];
}
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didFinishSpeechUtterance:(AVSpeechUtterance *)utterance {
  if (synthesizer != self.synthesizer) return;
  RCTPromiseResolveBlock completion = self.speechResolve; self.speechResolve = nil;
  [self cleanup]; if (completion) completion(@YES);
}
- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didCancelSpeechUtterance:(AVSpeechUtterance *)utterance {
  if (synthesizer == self.synthesizer) [self cleanup];
}
RCT_EXPORT_METHOD(finishInput) { [self endCapture]; }
RCT_EXPORT_METHOD(stop) { [self cleanup]; }
- (void)invalidate {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  if ([NSThread isMainThread]) [self cleanup];
  else dispatch_async(dispatch_get_main_queue(), ^{ [self cleanup]; });
  [super invalidate];
}
@end
